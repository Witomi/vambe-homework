import type { Metrics } from './api/types';

export interface CumulativePoint {
  month: string;
  /** Consultas al mes que sumaron los clientes que compraron ese mes. */
  added: number;
  /** Acumulado desde el primer mes hasta este. */
  total: number;
}

/**
 * Acumulado mes a mes de las consultas nuevas por automatizar. Un mes sin
 * reuniones analizadas suma 0.
 */
export function cumulativeInquiries(
  timeline: Metrics['timeline'],
): CumulativePoint[] {
  let total = 0;
  return timeline.map(({ month, estimatedNewAutomatedInquiries }) => {
    const added = estimatedNewAutomatedInquiries ?? 0;
    total += added;
    return { month, added, total };
  });
}
