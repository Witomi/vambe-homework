import { describe, expect, it } from 'vitest';
import { cumulativeInquiries } from './metrics';

const point = (month: string, inquiries: number | null) => ({
  month,
  count: 10,
  closed: 5,
  closeRate: 0.5,
  estimatedNewAutomatedInquiries: inquiries,
});

describe('cumulativeInquiries', () => {
  it('acumula mes a mes y cuenta como 0 los meses sin datos', () => {
    expect(
      cumulativeInquiries([
        point('2025-01', 100),
        point('2025-02', null),
        point('2025-03', 50),
      ]),
    ).toEqual([
      { month: '2025-01', added: 100, total: 100 },
      { month: '2025-02', added: 0, total: 100 },
      { month: '2025-03', added: 50, total: 150 },
    ]);
  });
});
