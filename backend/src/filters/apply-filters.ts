import {
  DIMENSION_KEYS,
  DIMENSIONS,
  DimensionKey,
  NOT_MENTIONED,
  volumeBucket,
} from '../domain/taxonomy';
import { Client } from '../domain/client';
import { normalizeText } from '../common/text';
import { ClientFilterDto } from './client-filter.dto';

/** Datos derivados que el filtro necesita además del cliente. */
export interface FilterContext {
  /** Texto normalizado (sin tildes) para la búsqueda. */
  searchableText: (id: string) => string;
  /** Nota A–D del cliente, o undefined si no está categorizado. */
  gradeOf: (id: string) => string | undefined;
}

function matchesDimension(
  client: Client,
  key: DimensionKey,
  selected: string[],
): boolean {
  if (!client.categories) return false;
  const value = client.categories[key];
  if (!DIMENSIONS[key].multi) return selected.includes(value as string);

  const values = value as string[];
  return values.length === 0
    ? selected.includes(NOT_MENTIONED.value)
    : values.some((v) => selected.includes(v));
}

/**
 * Aplica los filtros a la colección. Los filtros de categoría excluyen
 * automáticamente a los clientes aún no categorizados.
 */
export function applyFilters(
  clients: Client[],
  filter: ClientFilterDto,
  context: FilterContext,
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

    if (filter.grade) {
      const grade = context.gradeOf(c.id);
      if (!grade || !filter.grade.includes(grade)) return false;
    }
    if (filter.volume) {
      const bucket = volumeBucket(c.categories?.monthlyInquiries ?? null);
      if (!bucket || !filter.volume.includes(bucket)) return false;
    }
    for (const key of activeDimensions) {
      if (!matchesDimension(c, key, filter[key]!)) return false;
    }
    if (terms.length) {
      const text = `${context.searchableText(c.id)} ${normalizeText(c.categories?.summary ?? '')}`;
      if (!terms.every((t) => text.includes(t))) return false;
    }
    return true;
  });
}
