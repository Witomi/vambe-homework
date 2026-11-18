import type { DimensionKey } from './types';

/**
 * Los filtros viven en la URL: así una vista filtrada se puede compartir
 * o guardar como marcador, y el botón "atrás" funciona como se espera.
 */

export const FILTER_KEYS = [
  'search',
  'sellers',
  'closed',
  'categorized',
  'from',
  'to',
  'volume',
  'industry',
  'businessSize',
  'leadSource',
  'inquiryChannel',
  'painPoint',
  'useCases',
  'integrations',
  'requirements',
  'objections',
  'urgency',
  'complexity',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

/** Dimensiones que se ofrecen como filtro en la barra principal. */
export const PRIMARY_DIMENSIONS: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
  'painPoint',
];

export type SearchParams = Record<string, string | string[] | undefined>;

/** Toma solo los parámetros de filtro válidos (sin paginación ni UI). */
export function filterQuery(params: SearchParams): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = params[key];
    const str = Array.isArray(value) ? value.join(',') : value;
    if (str) query.set(key, str);
  }
  return query;
}

export function listParam(params: URLSearchParams, key: string): string[] {
  return params.get(key)?.split(',').filter(Boolean) ?? [];
}

export function countActiveFilters(params: URLSearchParams): number {
  return FILTER_KEYS.filter((k) => params.get(k)).length;
}
