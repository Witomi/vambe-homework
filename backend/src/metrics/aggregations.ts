import {
  DIMENSION_KEYS,
  DIMENSIONS,
  DimensionKey,
  VOLUME_BUCKETS,
  volumeBucket,
} from '../categorization/taxonomy';
import { Client } from '../data/client.model';

export interface RateStat {
  count: number;
  closed: number;
  /** 0..1, o null si no hay datos. */
  closeRate: number | null;
}

export interface BreakdownRow extends RateStat {
  value: string;
  label: string;
  /** Proporción del segmento categorizado que cae en este valor (0..1). */
  share: number;
}

export function rateStat(clients: readonly Client[]): RateStat {
  const closed = clients.filter((c) => c.closed).length;
  return {
    count: clients.length,
    closed,
    closeRate: clients.length ? closed / clients.length : null,
  };
}

function groupBy<T>(items: readonly T[], keysOf: (item: T) => string[]) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    for (const key of keysOf(item)) {
      const group = groups.get(key);
      if (group) group.push(item);
      else groups.set(key, [item]);
    }
  }
  return groups;
}

/** Tasa de cierre por cada valor de una dimensión (multi: un cliente cuenta en cada valor). */
export function breakdownByDimension(
  categorized: readonly Client[],
  key: DimensionKey,
): BreakdownRow[] {
  const groups = groupBy(categorized, (c) => {
    const v = c.categories![key];
    return Array.isArray(v) ? v : [v];
  });
  return DIMENSIONS[key].options
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

export function breakdownAllDimensions(categorized: readonly Client[]) {
  return Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, breakdownByDimension(categorized, k)]),
  ) as Record<DimensionKey, BreakdownRow[]>;
}

export function breakdownByVolume(
  categorized: readonly Client[],
): BreakdownRow[] {
  const groups = groupBy(categorized, (c) => {
    const b = volumeBucket(c.categories!.monthlyInquiries);
    return b ? [b] : [];
  });
  return VOLUME_BUCKETS.map((b) => {
    const group = groups.get(b.value) ?? [];
    return {
      value: b.value,
      label: b.label,
      share: categorized.length ? group.length / categorized.length : 0,
      ...rateStat(group),
    };
  });
}

export function timeline(clients: readonly Client[]) {
  const groups = groupBy(clients, (c) => [c.meetingDate.slice(0, 7)]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, group]) => ({ month, ...rateStat(group) }));
}

export function bySeller(clients: readonly Client[]) {
  const groups = groupBy(clients, (c) => [c.seller]);
  return [...groups.entries()]
    .map(([seller, group]) => ({ seller, ...rateStat(group) }))
    .sort((a, b) => b.count - a.count);
}

/** Matriz vendedor × industria: ¿quién convierte mejor cada rubro? */
export function sellerIndustryMatrix(categorized: readonly Client[]) {
  const sellers = [...new Set(categorized.map((c) => c.seller))].sort();
  const industries = breakdownByDimension(categorized, 'industry').map(
    ({ value, label }) => ({ value, label }),
  );
  const groups = groupBy(categorized, (c) => [
    `${c.seller}|${c.categories!.industry}`,
  ]);
  const cells = sellers.flatMap((seller) =>
    industries.map(({ value }) => ({
      seller,
      industry: value,
      ...rateStat(groups.get(`${seller}|${value}`) ?? []),
    })),
  );
  return { sellers, industries, cells };
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
