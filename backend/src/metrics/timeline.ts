import { RateStat, rateStat } from '../analytics/rates';
import { groupBy } from '../utils/collections';
import { Client, isCategorized } from '../domain/client';
import { computeKpis } from './kpis';

export interface TimelinePoint extends RateStat {
  /** Mes en formato `YYYY-MM`. */
  month: string;
  /**
   * Consultas al mes que suman los clientes que compraron ese mes
   * (estimado según las reuniones analizadas; null si no hay analizadas).
   */
  estimatedNewAutomatedInquiries: number | null;
}

/** Reuniones, tasa de cierre y consultas nuevas por mes, en orden cronológico. */
export function timeline(clients: readonly Client[]): TimelinePoint[] {
  const groups = groupBy(clients, (client) => [client.meetingDate.slice(0, 7)]);
  return [...groups.entries()]
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .map(([month, group]) => ({
      month,
      ...rateStat(group),
      estimatedNewAutomatedInquiries: computeKpis(
        group,
        group.filter(isCategorized),
      ).estimatedAutomatedMonthlyInquiries,
    }));
}
