import type { Metrics } from './api/types';

/**
 * Mínimo de reuniones para considerar confiable la tasa de un grupo
 * (2% de las analizadas, al menos 10, igual que en el backend).
 * Los grupos más chicos se muestran plegados al final.
 */
export function minReliableSample(kpis: Metrics['kpis']): number {
  return Math.max(10, Math.round(kpis.categorized * 0.02));
}

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
