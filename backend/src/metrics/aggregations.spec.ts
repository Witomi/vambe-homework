import { makeClient } from '../../test/fixtures';
import {
  breakdownAllDimensions,
  breakdownByDimension,
  breakdownByVolume,
  median,
  rateStat,
  sellerIndustryMatrix,
  timeline,
} from './aggregations';
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

  it('en dimensiones múltiples un cliente cuenta en cada valor', () => {
    const rows = breakdownByDimension(clients, 'useCases');
    expect(rows.find((r) => r.value === 'faq')?.count).toBe(2);
    expect(rows.find((r) => r.value === 'agendamiento')?.count).toBe(1);
  });

  it('agrupa por volumen de consultas', () => {
    const rows = breakdownByVolume(clients);
    expect(rows.find((r) => r.value === 'bajo')?.count).toBe(1);
    expect(rows.find((r) => r.value === 'medio')?.count).toBe(2);
  });

  it('timeline por mes en orden cronológico', () => {
    expect(timeline(clients).map((t) => [t.month, t.count])).toEqual([
      ['2024-01', 2],
      ['2024-02', 1],
    ]);
  });

  it('matriz vendedor × industria', () => {
    const m = sellerIndustryMatrix(clients);
    expect(m.sellers).toEqual(['Puma', 'Toro']);
    const cell = m.cells.find(
      (c) => c.seller === 'Puma' && c.industry === 'salud',
    );
    expect(cell).toMatchObject({ count: 2, closed: 1 });
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
      matrix: sellerIndustryMatrix(clients),
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
        matrix: sellerIndustryMatrix(clients),
      }),
    ).toEqual([]);
  });
});
