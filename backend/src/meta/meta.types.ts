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
  sellers: string[];
  dateRange: { from: string | null; to: string | null };
  categorization: {
    total: number;
    categorized: number;
    /** Modelos que generaron las categorizaciones existentes. */
    models: string[];
  };
}
