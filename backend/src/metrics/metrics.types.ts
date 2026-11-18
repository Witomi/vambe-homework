import { DimensionKey, DimensionOption } from '../domain/taxonomy';

/** Contrato de respuesta de `GET /api/metrics`. */

export interface RateStat {
  count: number;
  closed: number;
  /** 0..1, o null si no hay datos. */
  closeRate: number | null;
}

/** Una fila de desglose: un valor de una dimensión y su conversión. */
export interface BreakdownRow extends RateStat {
  value: string;
  label: string;
  /** Proporción del segmento categorizado que cae en este valor (0..1). */
  share: number;
}

export interface TimelinePoint extends RateStat {
  /** Mes en formato `YYYY-MM`. */
  month: string;
}

export interface SellerStat extends RateStat {
  seller: string;
}

export interface SellerIndustryCell extends RateStat {
  seller: string;
  industry: string;
}

export interface SellerIndustryMatrix {
  sellers: string[];
  industries: DimensionOption[];
  cells: SellerIndustryCell[];
}

export type InsightTone = 'positive' | 'negative' | 'neutral';

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
  sellers: SellerStat[];
  dimensions: Record<DimensionKey, BreakdownRow[]>;
  volume: BreakdownRow[];
  sellerIndustry: SellerIndustryMatrix;
  insights: Insight[];
}
