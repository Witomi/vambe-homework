import {
  DIMENSION_KEYS,
  DIMENSIONS,
  DimensionKey,
  VOLUME_BUCKETS,
  volumeBucket,
} from '../domain/taxonomy';
import { groupBy } from '../common/collections';
import { Client } from '../domain/client';
import {
  BreakdownRow,
  RateStat,
  SellerIndustryMatrix,
  SellerStat,
  TimelinePoint,
} from './metrics.types';

/** Cantidad, cerradas y tasa de cierre de un grupo de clientes. */
export function rateStat(clients: readonly Client[]): RateStat {
  const closed = clients.filter((c) => c.closed).length;
  return {
    count: clients.length,
    closed,
    closeRate: clients.length ? closed / clients.length : null,
  };
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

export function breakdownAllDimensions(
  categorized: readonly Client[],
): Record<DimensionKey, BreakdownRow[]> {
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

/** Reuniones y tasa de cierre por mes, en orden cronológico. */
export function timeline(clients: readonly Client[]): TimelinePoint[] {
  const groups = groupBy(clients, (c) => [c.meetingDate.slice(0, 7)]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, group]) => ({ month, ...rateStat(group) }));
}

/** Reuniones y tasa de cierre por vendedor, de mayor a menor volumen. */
export function bySeller(clients: readonly Client[]): SellerStat[] {
  const groups = groupBy(clients, (c) => [c.seller]);
  return [...groups.entries()]
    .map(([seller, group]) => ({ seller, ...rateStat(group) }))
    .sort((a, b) => b.count - a.count);
}

/** Matriz vendedor × industria: ¿quién convierte mejor cada rubro? */
export function sellerIndustryMatrix(
  categorized: readonly Client[],
): SellerIndustryMatrix {
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
