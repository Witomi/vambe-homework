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
  /** Consultas mensuales que los clientes cerrados delegan en Vambe. */
  automatedMonthlyInquiries: number;
}

export interface MetricsResponse {
  kpis: Kpis;
  timeline: TimelinePoint[];
  /** Sobre las reuniones analizadas con IA, ordenado por desempeño ajustado. */
  sellers: SellerPerformance[];
  dimensions: Record<DimensionKey, BreakdownRow[]>;
  insights: Insight[];
}
