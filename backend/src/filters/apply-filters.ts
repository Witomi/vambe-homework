import {
  DIMENSION_KEYS,
  DIMENSIONS,
  DimensionKey,
  volumeBucket,
} from '../domain/taxonomy';
import { Client } from '../domain/client';
import { normalizeText } from '../common/text';
import { ClientFilterDto } from './client-filter.dto';

export type SearchableText = (id: string) => string;

function matchesDimension(
  client: Client,
  key: DimensionKey,
  selected: string[],
): boolean {
  if (!client.categories) return false;
  const value = client.categories[key];
  return DIMENSIONS[key].multi
    ? (value as string[]).some((v) => selected.includes(v))
    : selected.includes(value as string);
}

/**
 * Aplica los filtros a la colección. Los filtros de categoría excluyen
 * automáticamente a los clientes aún no categorizados.
 */
export function applyFilters(
  clients: Client[],
  filter: ClientFilterDto,
  searchableText: SearchableText,
): Client[] {
  const terms = filter.search
    ? normalizeText(filter.search).split(/\s+/).filter(Boolean)
    : [];
  const activeDimensions = DIMENSION_KEYS.filter((k) => filter[k]?.length);

  return clients.filter((c) => {
    if (filter.sellers && !filter.sellers.includes(c.seller)) return false;
    if (filter.closed !== undefined && c.closed !== filter.closed) return false;
    if (
      filter.categorized !== undefined &&
      !!c.categories !== filter.categorized
    ) {
      return false;
    }
    if (filter.from && c.meetingDate < filter.from) return false;
    if (filter.to && c.meetingDate > filter.to) return false;

    if (filter.volume) {
      const bucket = volumeBucket(c.categories?.monthlyInquiries ?? null);
      if (!bucket || !filter.volume.includes(bucket)) return false;
    }
    for (const key of activeDimensions) {
      if (!matchesDimension(c, key, filter[key]!)) return false;
    }
    if (terms.length) {
      const text = `${searchableText(c.id)} ${normalizeText(c.categories?.summary ?? '')}`;
      if (!terms.every((t) => text.includes(t))) return false;
    }
    return true;
  });
}
