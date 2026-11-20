import {
  LlmResponseParseError,
  extractJson,
  parseBatchResponse,
  parseItem,
} from './response-parser';

const validItem = {
  ref: 1,
  industry: 'salud',
  businessSize: 'mediana',
  leadSource: 'referido',
  inquiryChannel: 'telefono',
  painPoint: 'consultas_repetitivas',
  useCases: ['agendamiento', 'faq'],
  integrations: ['agenda'],
  requirements: [],
  objections: [],
  urgency: 'alta',
  monthlyInquiries: 400,
  summary: 'Clínica que quiere automatizar citas',
};

describe('extractJson', () => {
  it('parsea JSON limpio', () => {
    expect(extractJson('[{"a":1}]')).toEqual([{ a: 1 }]);
  });

  it('tolera bloques de código y texto alrededor', () => {
    const text = 'Aquí está:\n```json\n[{"a":1}]\n```\nSaludos';
    expect(extractJson(text)).toEqual([{ a: 1 }]);
  });

  it('falla si no hay JSON', () => {
    expect(() => extractJson('lo siento, no puedo')).toThrow(
      LlmResponseParseError,
    );
  });
});

describe('parseItem', () => {
  it('acepta un elemento válido', () => {
    const { ref, categories } = parseItem(validItem);
    expect(ref).toBe(1);
    expect(categories.industry).toBe('salud');
    expect(categories.useCases).toEqual(['agendamiento', 'faq']);
    expect(categories.monthlyInquiries).toBe(400);
  });

  it('toda dimensión simple acepta "no especificado" u otro valor de escape', () => {
    // Antes "Tamaño" no lo tenía: si la reunión no lo decía, la respuesta
    // se rechazaba en cada intento y la reunión nunca se guardaba.
    const { categories } = parseItem({
      ...validItem,
      businessSize: 'no_especificado',
    });
    expect(categories.businessSize).toBe('no_especificado');
  });

  it('separa el volumen normal del volumen en peak', () => {
    const { categories } = parseItem({
      ...validItem,
      seasonality: 'con_peaks',
      monthlyInquiries: null,
      peakMonthlyInquiries: 1800,
    });
    expect(categories.seasonality).toBe('con_peaks');
    expect(categories.monthlyInquiries).toBeNull();
    expect(categories.peakMonthlyInquiries).toBe(1800);
    // Si no lo informa, queda "sin peaks" y sin cifra.
    const plain = parseItem({ ...validItem, seasonality: undefined });
    expect(plain.categories.seasonality).toBe('sin_peaks');
    expect(plain.categories.peakMonthlyInquiries).toBeNull();
  });

  it('calcula la complejidad en código e ignora la del LLM', () => {
    const { categories } = parseItem({ ...validItem, complexity: 'baja' });
    // agendamiento + 1 integración → media
    expect(categories.complexity).toBe('media');
  });

  it('más de 5.000 consultas al mes es volumen alto si no hay un dolor más prioritario', () => {
    const high = { ...validItem, monthlyInquiries: 7500 };
    expect(parseItem(high).categories.painPoint).toBe('volumen_alto');
    // Pérdida de ventas tiene más prioridad que el volumen.
    expect(
      parseItem({ ...high, painPoint: 'perdida_ventas' }).categories.painPoint,
    ).toBe('perdida_ventas');
    expect(parseItem(validItem).categories.painPoint).toBe(
      'consultas_repetitivas',
    );
  });

  it('normaliza mayúsculas, tildes y espacios', () => {
    const { categories } = parseItem({
      ...validItem,
      industry: 'Servicios Profesionales',
      businessSize: 'Pequeña',
    });
    expect(categories.industry).toBe('servicios_profesionales');
    expect(categories.businessSize).toBe('pequena');
  });

  it('usa "otro" o el valor por defecto ante valores desconocidos', () => {
    const { categories } = parseItem({
      ...validItem,
      industry: 'minería espacial',
      urgency: 'altísima',
    });
    expect(categories.industry).toBe('otro');
    expect(categories.urgency).toBe('media');
  });

  it('un valor fuera de la taxonomía cae en el valor de escape', () => {
    expect(
      parseItem({ ...validItem, businessSize: 'gigante' }).categories
        .businessSize,
    ).toBe('no_especificado');
  });

  it('rechaza un elemento sin "ref" para emparejarlo', () => {
    expect(() => parseItem({ ...validItem, ref: 'x' })).toThrow(
      LlmResponseParseError,
    );
  });

  it('filtra valores inválidos y duplicados en listas', () => {
    const { categories } = parseItem({
      ...validItem,
      useCases: ['faq', 'FAQ', 'teletransporte'],
    });
    expect(categories.useCases).toEqual(['faq']);
  });

  it('interpreta consultas como texto y descarta valores no positivos', () => {
    expect(
      parseItem({ ...validItem, monthlyInquiries: '1.500' }).categories
        .monthlyInquiries,
    ).toBe(1500);
    expect(
      parseItem({ ...validItem, monthlyInquiries: 0 }).categories
        .monthlyInquiries,
    ).toBeNull();
  });
});

describe('parseBatchResponse', () => {
  it('omite elementos inválidos sin descartar el lote', () => {
    const text = JSON.stringify([
      validItem,
      { ...validItem, ref: 'sin-ref' },
      { ...validItem, ref: 3 },
    ]);
    expect(parseBatchResponse(text).map((i) => i.ref)).toEqual([1, 3]);
  });
});
