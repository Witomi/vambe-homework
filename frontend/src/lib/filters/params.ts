import { DIMENSION_KEYS } from '../api/schemas';
import type { DimensionKey } from '../api/types';

/**
 * Los filtros viven en la URL: así una vista filtrada se puede compartir
 * o guardar como marcador, y el botón "atrás" funciona como se espera.
 */

/** Parámetros de filtro que entiende el backend (además de paginación y orden). */
export const FILTER_KEYS = [
  'search',
  'sellers',
  'closed',
  'categorized',
  'from',
  'to',
  'volume',
  ...DIMENSION_KEYS,
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

/** Dimensiones que se ofrecen siempre visibles en la barra de filtros. */
export const PRIMARY_DIMENSIONS: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
  'painPoint',
];

/** `searchParams` tal como los entrega Next.js a una página. */
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

/** Lee un parámetro de lista: `?industry=salud,retail` → `['salud', 'retail']`. */
export function listParam(params: URLSearchParams, key: string): string[] {
  return params.get(key)?.split(',').filter(Boolean) ?? [];
}

export function countActiveFilters(params: URLSearchParams): number {
  return FILTER_KEYS.filter((k) => params.get(k)).length;
}

/** Agrega el valor si no está, o lo quita si ya estaba. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
