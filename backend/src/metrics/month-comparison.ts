import { groupBy } from '../common/collections';
import { Client, isCategorized } from '../domain/client';
import { computeKpis } from './kpis';
import { MonthComparison, MonthKpis } from './metrics.types';

/** Desplaza un mes `YYYY-MM` en `delta` meses: ('2025-01', -1) → '2024-12'. */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const index = year * 12 + (m - 1) + delta;
  const shiftedMonth = String((index % 12) + 1).padStart(2, '0');
  return `${Math.floor(index / 12)}-${shiftedMonth}`;
}

/**
 * KPIs de un mes comparados con el mes anterior y con el mismo mes del año
 * anterior. Sin `month`, se usa el último mes con reuniones en el segmento.
 * Un mes sin reuniones se informa igual, con 0 reuniones y tasa null.
 */
export function compareMonth(
  clients: readonly Client[],
  month?: string,
): MonthComparison | null {
  const byMonth = groupBy(clients, (c) => [c.meetingDate.slice(0, 7)]);
  const reference = month ?? [...byMonth.keys()].sort().at(-1);
  if (!reference) return null;

  const kpisOf = (month: string): MonthKpis => {
    const group = byMonth.get(month) ?? [];
    return { month, ...computeKpis(group, group.filter(isCategorized)) };
  };

  return {
    current: kpisOf(reference),
    previousMonth: kpisOf(shiftMonth(reference, -1)),
    sameMonthLastYear: kpisOf(shiftMonth(reference, -12)),
  };
}
