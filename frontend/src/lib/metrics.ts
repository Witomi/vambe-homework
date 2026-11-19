import type { Metrics } from './api/types';

/**
 * Mínimo de reuniones para considerar confiable la tasa de un grupo
 * (2% de las analizadas, al menos 10, igual que en el backend).
 * Los grupos más chicos se muestran plegados al final.
 */
export function minReliableSample(kpis: Metrics['kpis']): number {
  return Math.max(10, Math.round(kpis.categorized * 0.02));
}
