import { describe, expect, it } from 'vitest';
import { closeRateComparison, meetingsComparison } from './kpis';

const month = (
  m: string,
  meetings: number,
  closed: number,
  closeRate: number | null,
) => ({
  month: m,
  meetings,
  closed,
  closeRate,
  categorized: meetings,
  coverage: 1,
  categorizedCloseRate: closeRate,
  medianMonthlyInquiries: null,
  automatedMonthlyInquiries: 0,
  estimatedAutomatedMonthlyInquiries: null,
});

const comparison = {
  current: month('2025-03', 120, 60, 0.5),
  previousMonth: month('2025-02', 100, 40, 0.4),
  sameMonthLastYear: month('2024-03', 0, 0, null),
};

describe('meetingsComparison', () => {
  it('compara con el mes anterior y deja vacío el mes sin reuniones', () => {
    const [previous, lastYear] = meetingsComparison(comparison);
    expect(previous).toMatchObject({ value: '100', direction: 1 });
    expect(previous.text).toContain('20');
    expect(lastYear).toMatchObject({ value: null, text: null, direction: 0 });
  });
});

describe('closeRateComparison', () => {
  it('expresa el cambio en puntos', () => {
    const [previous] = closeRateComparison(comparison);
    expect(previous).toMatchObject({ value: '40%', direction: 1 });
    expect(previous.text).toContain('10');
  });
});
