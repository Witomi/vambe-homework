import { RateStat, rateStat } from '../analytics/rates';
import { groupBy } from '../common/collections';
import { Client } from '../domain/client';

export interface TimelinePoint extends RateStat {
  /** Mes en formato `YYYY-MM`. */
  month: string;
}

/** Reuniones y tasa de cierre por mes, en orden cronológico. */
export function timeline(clients: readonly Client[]): TimelinePoint[] {
  const groups = groupBy(clients, (c) => [c.meetingDate.slice(0, 7)]);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, group]) => ({ month, ...rateStat(group) }));
}
