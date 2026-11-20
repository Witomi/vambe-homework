import { makeClient } from '../../test/fixtures';
import { breakdownAllDimensions } from '../analytics/breakdown';
import { rateStat } from '../analytics/rates';
import { generateInsights } from './insights';
import { sellerPerformance } from '../analytics/seller-performance';
import { computeKpis } from './kpis';
import { compareMonth, shiftMonth } from './month-comparison';
import { timeline } from './timeline';

describe('timeline', () => {
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

  it('timeline por mes en orden cronológico', () => {
    expect(timeline(clients).map((t) => [t.month, t.count])).toEqual([
      ['2024-01', 2],
      ['2024-02', 1],
    ]);
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

describe('compareMonth', () => {
  it('usa el mes pedido en vez del último', () => {
    const comparison = compareMonth(
      [
        makeClient({ meetingDate: '2024-03-05' }),
        makeClient({ meetingDate: '2025-03-01' }),
      ],
      '2024-03',
    )!;
    expect(comparison.current).toMatchObject({ month: '2024-03', meetings: 1 });
    expect(comparison.sameMonthLastYear).toMatchObject({ month: '2023-03' });
  });

  it('desplaza meses cruzando el año', () => {
    expect(shiftMonth('2025-01', -1)).toBe('2024-12');
    expect(shiftMonth('2025-03', -12)).toBe('2024-03');
    expect(shiftMonth('2024-12', 1)).toBe('2025-01');
  });

  it('compara el último mes con el anterior y con el del año pasado', () => {
    const on = (meetingDate: string, closed: boolean) =>
      makeClient({ meetingDate, closed });
    const comparison = compareMonth([
      on('2024-03-05', true),
      on('2024-03-20', false),
      on('2025-02-10', false),
      on('2025-03-01', true),
      on('2025-03-15', true),
      on('2025-03-31', false),
    ])!;

    expect(comparison.current).toMatchObject({
      month: '2025-03',
      meetings: 3,
      closed: 2,
    });
    expect(comparison.previousMonth).toMatchObject({
      month: '2025-02',
      meetings: 1,
    });
    expect(comparison.sameMonthLastYear).toMatchObject({
      month: '2024-03',
      meetings: 2,
      closeRate: 0.5,
    });
  });

  it('informa con 0 reuniones los meses vacíos, y null si no hay segmento', () => {
    const comparison = compareMonth([
      makeClient({ meetingDate: '2025-03-01' }),
    ])!;
    expect(comparison.previousMonth).toMatchObject({
      month: '2025-02',
      meetings: 0,
      closeRate: null,
    });
    expect(comparison.sameMonthLastYear).toMatchObject({
      month: '2024-03',
      meetings: 0,
    });
    expect(compareMonth([])).toBeNull();
  });
});

describe('computeKpis', () => {
  it('estima las consultas automatizadas escalando por la cobertura', () => {
    const analyzed = [
      makeClient({ closed: true, categories: { monthlyInquiries: 300 } }),
      makeClient({ closed: false, categories: { monthlyInquiries: 900 } }),
    ];
    const pending = [
      makeClient({ categories: null }),
      makeClient({ categories: null }),
    ];
    const kpis = computeKpis([...analyzed, ...pending], analyzed);

    expect(kpis.coverage).toBe(0.5);
    expect(kpis.automatedMonthlyInquiries).toBe(300);
    expect(kpis.estimatedAutomatedMonthlyInquiries).toBe(600);
  });

  it('sin reuniones analizadas no hay estimación', () => {
    const kpis = computeKpis([makeClient({ categories: null })], []);
    expect(kpis.estimatedAutomatedMonthlyInquiries).toBeNull();
  });
});
