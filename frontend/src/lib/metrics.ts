import type { Metrics } from './api/types';

/**
 * Mínimo de reuniones para considerar confiable la tasa de un segmento
 * (2% de las categorizadas, al menos 5). Segmentos más chicos se atenúan.
 */
export function minReliableSample(kpis: Metrics['kpis']): number {
  return Math.max(5, Math.round(kpis.categorized * 0.02));
}
