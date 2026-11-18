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
  complexity: 'media',
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

  it('rechaza dimensiones sin valor por defecto', () => {
    expect(() => parseItem({ ...validItem, businessSize: 'gigante' })).toThrow(
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
      { ...validItem, ref: 2, businessSize: 'gigante' },
      { ...validItem, ref: 3 },
    ]);
    expect(parseBatchResponse(text).map((i) => i.ref)).toEqual([1, 3]);
  });
});
