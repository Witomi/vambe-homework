import { groupBy } from '../common/collections';
import { CategorizedClient } from '../domain/client';
import {
  DIMENSION_KEYS,
  DimensionKey,
  NOT_MENTIONED,
  displayOptions,
} from '../domain/categories';
import { RateStat, rateStat } from './rates';

/** Un valor de una dimensión y cómo convierten los clientes que lo tienen. */
export interface BreakdownRow extends RateStat {
  value: string;
  label: string;
  /** Proporción de los clientes categorizados que tiene este valor (0..1). */
  share: number;
}

/**
 * Valores de una dimensión para un cliente. En dimensiones de lista, una
 * lista vacía cuenta como "No lo menciona".
 */
export function valuesOf(
  client: CategorizedClient,
  key: DimensionKey,
): string[] {
  const value = client.categories[key];
  if (!Array.isArray(value)) return [value];
  return value.length ? value : [NOT_MENTIONED.value];
}

/** Los clientes que tienen un valor de una dimensión (p. ej. industria = salud). */
export function membersOf(
  categorized: readonly CategorizedClient[],
  key: DimensionKey,
  value: string,
): CategorizedClient[] {
  return categorized.filter((c) => valuesOf(c, key).includes(value));
}

/**
 * Tasa de cierre por cada valor de una dimensión. En dimensiones de lista
 * un cliente cuenta en cada valor que mencionó, o en "No lo menciona".
 */
export function breakdownByDimension(
  categorized: readonly CategorizedClient[],
  key: DimensionKey,
): BreakdownRow[] {
  const groups = groupBy(categorized, (c) => valuesOf(c, key));

  return displayOptions(key)
    .map((option) => {
      const group = groups.get(option.value) ?? [];
      return {
        value: option.value,
        label: option.label,
        share: categorized.length ? group.length / categorized.length : 0,
        ...rateStat(group),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function breakdownAllDimensions(
  categorized: readonly CategorizedClient[],
): Record<DimensionKey, BreakdownRow[]> {
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, breakdownByDimension(categorized, key)]),
  ) as Record<DimensionKey, BreakdownRow[]>;
}
