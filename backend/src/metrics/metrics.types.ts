import { BreakdownRow } from '../analytics/breakdown';
import { DimensionKey } from '../domain/categories';
import { SellerPerformance } from '../analytics/seller-performance';
import { TimelinePoint } from './timeline';

export type { BreakdownRow, SellerPerformance, TimelinePoint };

/** Contrato de respuesta de `GET /api/metrics`. */

/** positive: cierra sobre el promedio · negative: cierra bajo el promedio. */
export type InsightTone = 'positive' | 'negative';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  /** Filtro sugerido para explorar el insight en el panel. */
  filter?: { key: string; value: string };
}

export interface Kpis {
  meetings: number;
  closed: number;
  closeRate: number | null;
  categorized: number;
  /** Proporción del segmento que ya fue categorizada (0..1). */
  coverage: number;
  /** Tasa de cierre dentro de los categorizados (base de comparación). */
  categorizedCloseRate: number | null;
  medianMonthlyInquiries: number | null;
  /**
   * Consultas al mes que atiende Vambe en los clientes que compraron,
   * sumando solo las reuniones analizadas con IA.
   */
  automatedMonthlyInquiries: number;
  /** Lo mismo estimado para todo el segmento; null si no hay analizadas. */
  estimatedAutomatedMonthlyInquiries: number | null;
}

/** KPIs de un mes (`YYYY-MM`). */
export interface MonthKpis extends Kpis {
  month: string;
}

/** Un mes frente al mes anterior y al mismo mes del año pasado. */
export interface MonthComparison {
  current: MonthKpis;
  previousMonth: MonthKpis;
  sameMonthLastYear: MonthKpis;
}

export interface MetricsResponse {
  /** Todo el período filtrado. */
  kpis: Kpis;
  /** Mes revisado vs. anteriores; null en modo histórico o sin reuniones. */
  monthComparison: MonthComparison | null;
  timeline: TimelinePoint[];
  /** Sobre las reuniones analizadas con IA, ordenado por desempeño ajustado. */
  sellers: SellerPerformance[];
  dimensions: Record<DimensionKey, BreakdownRow[]>;
  /**
   * Mínimo de reuniones analizadas para que la tasa de un grupo sea
   * confiable; los grupos más chicos se muestran atenuados.
   */
  minReliableSample: number;
  insights: Insight[];
}
