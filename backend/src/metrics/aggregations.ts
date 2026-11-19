import {
  DIMENSION_KEYS,
  DimensionKey,
  NOT_MENTIONED,
  displayOptions,
} from '../domain/taxonomy';
import { groupBy } from '../common/collections';
import { Client } from '../domain/client';
import { BreakdownRow, RateStat, TimelinePoint } from './metrics.types';

/** Cantidad, cerradas y tasa de cierre de un grupo de clientes. */
export function rateStat(clients: readonly Client[]): RateStat {
  const closed = clients.filter((c) => c.closed).length;
  return {
    count: clients.length,
    closed,
    closeRate: clients.length ? closed / clients.length : null,
  };
}

/**
 * Tasa de cierre por cada valor de una dimensión. En dimensiones de lista
 * un cliente cuenta en cada valor que mencionó, o en "No lo menciona".
 */
export function breakdownByDimension(
  categorized: readonly Client[],
  key: DimensionKey,
): BreakdownRow[] {
  const groups = groupBy(categorized, (c) => {
    const v = c.categories![key];
    if (!Array.isArray(v)) return [v];
    // Lista vacía = el cliente no mencionó nada de esta dimensión.
    return v.length ? v : [NOT_MENTIONED.value];
  });
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
  categorized: readonly Client[],
): Record<DimensionKey, BreakdownRow[]> {
  return Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, breakdownByDimension(categorized, k)]),
  ) as Record<DimensionKey, BreakdownRow[]>;
}

/** Reuniones y tasa de cierre por mes, en orden cronológico. */
export function timeline(clients: readonly Client[]): TimelinePoint[] {
  const groups = groupBy(clients, (c) => [c.meetingDate.slice(0, 7)]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, group]) => ({ month, ...rateStat(group) }));
}
