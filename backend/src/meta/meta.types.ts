import { DimensionKey, DimensionOption } from '../domain/taxonomy';

/** Contrato de respuesta de `GET /api/meta`. */

export interface DimensionMeta {
  key: DimensionKey;
  label: string;
  description: string;
  multi: boolean;
  options: readonly DimensionOption[];
}

export interface MetaResponse {
  dimensions: DimensionMeta[];
  volumeBuckets: DimensionOption[];
  /** Notas A–D para filtrar por probabilidad de cierre. */
  grades: DimensionOption[];
  /** Valor que representa "no mencionó nada" en dimensiones de lista. */
  notMentioned: DimensionOption;
  sellers: string[];
  dateRange: { from: string | null; to: string | null };
  categorization: {
    total: number;
    categorized: number;
    /** Modelos que generaron las categorizaciones existentes. */
    models: string[];
  };
}
