import { SellerPerformance } from '../analytics/seller-performance';
import { DimensionOption } from '../domain/categories';

/** Contrato de respuesta de `GET /api/sellers`. */

/** Cómo le fue a un vendedor (o al equipo) en un rubro. */
export interface IndustryResult {
  count: number;
  closed: number;
  /** 0..1, o null si no tuvo reuniones en el rubro. */
  closeRate: number | null;
}

/** Una fila de la tabla vendedor × industria. */
export interface IndustryRow {
  industry: DimensionOption;
  team: IndustryResult;
  /** Resultado de cada vendedor, en el mismo orden que `sellers`. */
  sellers: IndustryResult[];
}

/** Rubro donde un vendedor más se aleja del equipo (para bien o para mal). */
export interface IndustryHighlight {
  industry: DimensionOption;
  closeRate: number;
  teamRate: number;
  count: number;
}

export interface SellerSummary extends SellerPerformance {
  /** Rubro donde más supera al equipo; null si no hay muestra suficiente. */
  strongest: IndustryHighlight | null;
  /** Rubro donde más queda bajo el equipo. */
  weakest: IndustryHighlight | null;
}

export interface SellersResponse {
  /** Tasa de cierre del equipo en las reuniones analizadas con IA. */
  baseRate: number | null;
  /** Reuniones mínimas en un rubro para comparar a un vendedor con el equipo. */
  minSample: number;
  /** Ordenados por desempeño ajustado por cartera (mejor primero). */
  sellers: SellerSummary[];
  /** Rubros de más a menos reuniones; "Otro" al final. */
  industries: IndustryRow[];
}
