import { baseCategories } from '../../../test/fixtures';
import { Categories } from '../../domain/categories';
import { GoldItem, evaluate } from './evaluate';

const gold = (
  id: string,
  expected: Partial<Categories>,
  reviewed = true,
): GoldItem => ({
  id,
  transcript: '',
  reviewed,
  expected: { ...baseCategories, ...expected },
});

const score = (report: ReturnType<typeof evaluate>, dimension: string) =>
  report.dimensions.find((d) => d.dimension === dimension)!;

describe('evaluate', () => {
  const predicted = new Map<string, Categories>([
    ['a', { ...baseCategories, industry: 'salud', useCases: ['agendamiento'] }],
    [
      'b',
      {
        ...baseCategories,
        industry: 'retail',
        useCases: ['faq', 'catalogo'],
        monthlyInquiries: 1150,
      },
    ],
  ]);

  it('mide aciertos exactos en dimensiones simples', () => {
    const report = evaluate(
      [gold('a', { industry: 'salud' }), gold('b', { industry: 'ecommerce' })],
      predicted,
    );
    expect(report.evaluated).toBe(2);
    expect(score(report, 'industry').exactMatch).toBe(0.5);
  });

  it('mide coincidencia exacta y solapamiento en listas', () => {
    const report = evaluate(
      [
        gold('a', { useCases: ['agendamiento'] }), // igual → 1
        gold('b', { useCases: ['catalogo'] }), // {faq,catalogo} vs {catalogo} → 1/2
      ],
      predicted,
    );
    expect(score(report, 'useCases').exactMatch).toBe(0.5);
    expect(score(report, 'useCases').overlap).toBe(0.75);
  });

  it('acepta el volumen de consultas con ±20% de tolerancia', () => {
    const report = evaluate(
      [gold('b', { monthlyInquiries: 1000 })], // 1150 está dentro del 20%
      predicted,
    );
    expect(report.inquiriesWithin20Pct).toBe(1);
  });

  it('ignora casos no revisados por una persona', () => {
    const report = evaluate([gold('a', {}, false)], predicted);
    expect(report.evaluated).toBe(0);
  });

  it('reporta el acierto de cada caso y qué campos fallaron', () => {
    const report = evaluate(
      [gold('a', { industry: 'salud' }), gold('b', { industry: 'ecommerce' })],
      predicted,
    );
    const [a, b] = report.cases;
    expect(a).toMatchObject({ position: 1, accuracy: 1, errors: [] });
    expect(b.position).toBe(2);
    expect(b.errors).toEqual(
      expect.arrayContaining(['Industria', 'Casos de uso']),
    );
    expect(b.accuracy).toBeLessThan(1);
  });
});
