import { DimensionKey } from '../domain/taxonomy';

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

/** Desempeño de un vendedor frente a lo esperado según su cartera. */
export interface SellerPerformance {
  seller: string;
  count: number;
  closed: number;
  closeRate: number;
  /** Tasa que se esperaba según los leads que recibió (0..1). */
  expectedRate: number;
}

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
