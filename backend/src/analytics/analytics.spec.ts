import { makeClient } from '../../test/fixtures';
import { median } from '../utils/collections';
import { Categories } from '../domain/categories';
import { breakdownByDimension, membersOf } from './breakdown';
import { findWinningTraits } from './winning-traits';
import { minReliableSample, pointsDiff, rateStat } from './rates';

describe('analytics', () => {
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
    expect(rows.map((row) => [row.value, row.count, row.closed])).toEqual([
      ['salud', 2, 1],
      ['retail', 1, 1],
    ]);
    expect(rows[0].share).toBeCloseTo(2 / 3);
  });

  it('en dimensiones múltiples cuenta a quienes no mencionan nada', () => {
    const rows = breakdownByDimension(clients, 'useCases');
    // El tercer cliente tiene useCases: [] → 1 de 3.
    const none = rows.find((row) => row.value === 'no_menciona');
    expect(none).toMatchObject({ count: 1, label: 'No lo menciona' });
    expect(none?.share).toBeCloseTo(1 / 3);
  });

  it('en dimensiones múltiples un cliente cuenta en cada valor', () => {
    const rows = breakdownByDimension(clients, 'useCases');
    expect(rows.find((row) => row.value === 'faq')?.count).toBe(2);
    expect(rows.find((row) => row.value === 'agendamiento')?.count).toBe(1);
  });

  it('median', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
  });

  it('pointsDiff resta los porcentajes ya redondeados', () => {
    // 69,4% vs. 67,6%: en pantalla 69% y 68% → 1 punto, no 2.
    expect(pointsDiff(0.694, 0.676)).toBe(1);
  });

  it('minReliableSample nunca baja de 10', () => {
    expect(minReliableSample(100)).toBe(10);
    expect(minReliableSample(1000, 0.03)).toBe(30);
  });
});

describe('findWinningTraits', () => {
  const many = (
    count: number,
    closed: number,
    categories: Partial<Categories>,
  ) =>
    Array.from({ length: count }, (_, index) =>
      makeClient({ closed: index < closed, categories }),
    );

  it('encuentra el rasgo con el que el grupo cierra más', () => {
    const group = [
      ...many(20, 18, { leadSource: 'referido' }),
      ...many(80, 32, { leadSource: 'google' }),
    ];
    const [trait] = findWinningTraits(group);
    expect(trait).toMatchObject({
      dimension: 'leadSource',
      value: 'referido',
      closeRate: 0.9,
      groupRate: 0.5,
    });
  });

  it('ignora muestras chicas, rasgos que tiene todo el grupo y la dimensión excluida', () => {
    const group = [
      // 3 de 3 es 100%, pero es muy poco para concluir.
      ...many(3, 3, { leadSource: 'referido', industry: 'salud' }),
      ...many(97, 40, { leadSource: 'google', industry: 'salud' }),
    ];
    expect(findWinningTraits(group)).toEqual([]);

    const split = [
      ...many(30, 27, { industry: 'retail' }),
      ...many(70, 28, { industry: 'salud' }),
    ];
    expect(findWinningTraits(split).map((trait) => trait.dimension)).toContain(
      'industry',
    );
    expect(findWinningTraits(split, 'industry')).toEqual([]);
  });

  it('membersOf incluye "No lo menciona" en dimensiones de lista', () => {
    const clients = [
      makeClient({ categories: { objections: [] } }),
      makeClient({ categories: { objections: ['precio'] } }),
    ];
    expect(membersOf(clients, 'objections', 'no_menciona')).toHaveLength(1);
    expect(membersOf(clients, 'objections', 'precio')).toHaveLength(1);
  });
});
