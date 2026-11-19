import { makeClient } from '../../test/fixtures';
import {
  breakdownAllDimensions,
  breakdownByDimension,
  rateStat,
  timeline,
} from './aggregations';
import { median } from '../common/collections';
import { sellerPerformance } from './seller-performance';
import { generateInsights } from './insights';

describe('aggregations', () => {
  const clients = [
    makeClient({
      closed: true,
      meetingDate: '2024-01-03',
      categories: { industry: 'salud', useCases: ['faq', 'agendamiento'] },
    }),
    makeClient({
      closed: false,
      meetingDate: '2024-01-20',
      categories: { industry: 'salud', useCases: ['faq'] },
    }),
    makeClient({
      closed: true,
      meetingDate: '2024-02-11',
      seller: 'Toro',
      categories: { industry: 'retail', useCases: [], monthlyInquiries: 50 },
    }),
  ];

  it('rateStat calcula la tasa de cierre', () => {
    expect(rateStat(clients)).toEqual({
      count: 3,
      closed: 2,
      closeRate: 2 / 3,
    });
    expect(rateStat([]).closeRate).toBeNull();
  });

  it('breakdown de dimensión simple ordenado por volumen', () => {
    const rows = breakdownByDimension(clients, 'industry');
    expect(rows.map((r) => [r.value, r.count, r.closed])).toEqual([
      ['salud', 2, 1],
      ['retail', 1, 1],
    ]);
    expect(rows[0].share).toBeCloseTo(2 / 3);
  });

  it('en dimensiones múltiples cuenta a quienes no mencionan nada', () => {
    const rows = breakdownByDimension(clients, 'useCases');
    // El tercer cliente tiene useCases: [] → 1 de 3.
    const none = rows.find((r) => r.value === 'no_menciona');
    expect(none).toMatchObject({ count: 1, label: 'No lo menciona' });
    expect(none?.share).toBeCloseTo(1 / 3);
  });

  it('en dimensiones múltiples un cliente cuenta en cada valor', () => {
    const rows = breakdownByDimension(clients, 'useCases');
    expect(rows.find((r) => r.value === 'faq')?.count).toBe(2);
    expect(rows.find((r) => r.value === 'agendamiento')?.count).toBe(1);
  });

  it('timeline por mes en orden cronológico', () => {
    expect(timeline(clients).map((t) => [t.month, t.count])).toEqual([
      ['2024-01', 2],
      ['2024-02', 1],
    ]);
  });

  it('median', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });
});

describe('generateInsights', () => {
  it('detecta segmentos sobre y bajo el promedio con muestra suficiente', () => {
    const clients = [
      ...Array.from({ length: 30 }, (_, i) =>
        makeClient({ closed: i < 27, categories: { leadSource: 'referido' } }),
      ),
      ...Array.from({ length: 30 }, (_, i) =>
        makeClient({
          closed: i < 9,
          categories: { leadSource: 'redes_sociales' },
        }),
      ),
    ];
    const dimensions = breakdownAllDimensions(clients);
    const insights = generateInsights({
      baseRate: rateStat(clients).closeRate,
      categorizedCount: clients.length,
      dimensions,
    });

    const positive = insights.find((i) => i.tone === 'positive');
    const negative = insights.find((i) => i.tone === 'negative');
    expect(positive?.filter).toEqual({ key: 'leadSource', value: 'referido' });
    expect(negative?.filter).toEqual({
      key: 'leadSource',
      value: 'redes_sociales',
    });
  });

  it('no genera hallazgos con muestras chicas', () => {
    const clients = [makeClient({ closed: true })];
    expect(
      generateInsights({
        baseRate: 1,
        categorizedCount: 1,
        dimensions: breakdownAllDimensions(clients),
      }),
    ).toEqual([]);
  });

  it('la diferencia en puntos cuadra con los porcentajes del texto', () => {
    // Tasas "incómodas" para el redondeo: 29/43 = 67,4%, 31/44 = 70,5%, etc.
    const groups: [string, number, number][] = [
      ['referido', 44, 31],
      ['linkedin', 43, 29],
      ['google', 41, 22],
      ['evento', 47, 37],
      ['contenido', 39, 24],
    ];
    const clients = groups.flatMap(([leadSource, count, closed]) =>
      Array.from({ length: count }, (_, i) =>
        makeClient({ closed: i < closed, categories: { leadSource } }),
      ),
    );

    const insights = generateInsights({
      baseRate: rateStat(clients).closeRate,
      categorizedCount: clients.length,
      dimensions: breakdownAllDimensions(clients),
    });

    expect(insights.length).toBeGreaterThan(0);
    for (const { detail } of insights) {
      const [, rate, points, direction, base] =
        /Cierran (\d+)%, (\d+) puntos (más|menos) que el promedio \((\d+)%\)/.exec(
          detail,
        )!;
      const diff = Number(rate) - Number(base);
      expect(Math.abs(diff)).toBe(Number(points));
      expect(direction).toBe(diff > 0 ? 'más' : 'menos');
    }
  });
});

describe('sellerPerformance', () => {
  /** `n` clientes de un vendedor en un rubro, de los cuales `closed` cerraron. */
  const leads = (seller: string, industry: string, n: number, closed: number) =>
    Array.from({ length: n }, (_, i) =>
      makeClient({ seller, closed: i < closed, categories: { industry } }),
    );

  it('ajusta por cartera: compara con lo esperado en los rubros de cada vendedor', () => {
    // Salud cierra 80% en el equipo; Educación, 40%.
    const clients = [
      ...leads('Toro', 'salud', 20, 17), // 85% donde se espera 80% → +5
      ...leads('Zorro', 'salud', 20, 15), // 75% donde se espera 80% → −5
      ...leads('Puma', 'educacion', 20, 11), // 55% donde se espera 40% → +15
      ...leads('Boa', 'educacion', 20, 5), // 25% donde se espera 40% → −15
    ];

    const result = sellerPerformance(clients);

    // Por tasa cruda Puma (55%) quedaría tercero; ajustado, es el mejor.
    expect(result.map((s) => s.seller)).toEqual([
      'Puma',
      'Toro',
      'Zorro',
      'Boa',
    ]);
    const puma = result[0];
    expect(puma.closeRate).toBeCloseTo(0.55);
    expect(puma.expectedRate).toBeCloseTo(0.4);
  });
});
