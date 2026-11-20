import {
  DIMENSION_KEYS,
  DIMENSIONS,
  DimensionKey,
  NOT_MENTIONED,
} from '../domain/categories';
import { volumeBucket } from '../domain/volume';
import { Client } from '../domain/client';
import { normalizeText } from '../common/text';
import { ClientFilterDto } from './client-filter.dto';

/** Datos derivados que el filtro necesita además del cliente. */
export interface FilterContext {
  /** Texto normalizado (sin tildes) para la búsqueda. */
  searchableText: (id: string) => string;
  /** Nota A–F del cliente, o undefined si no está categorizado. */
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
    : values.some((value) => selected.includes(value));
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
  const activeDimensions = DIMENSION_KEYS.filter((key) => filter[key]?.length);

  return clients.filter((client) => {
    if (filter.sellers && !filter.sellers.includes(client.seller)) return false;
    if (filter.closed !== undefined && client.closed !== filter.closed)
      return false;
    if (
      filter.categorized !== undefined &&
      !!client.categories !== filter.categorized
    ) {
      return false;
    }
    if (filter.from && client.meetingDate < filter.from) return false;
    if (filter.to && client.meetingDate > filter.to) return false;

    if (filter.grade) {
      const grade = context.gradeOf(client.id);
      if (!grade || !filter.grade.includes(grade)) return false;
    }
    if (filter.volume) {
      const bucket = volumeBucket(client.categories?.monthlyInquiries ?? null);
      if (!bucket || !filter.volume.includes(bucket)) return false;
    }
    for (const key of activeDimensions) {
      const selected = filter[key] ?? [];
      if (!matchesDimension(client, key, selected)) return false;
    }
    if (terms.length) {
      const text = `${context.searchableText(client.id)} ${normalizeText(client.categories?.summary ?? '')}`;
      if (!terms.every((term) => text.includes(term))) return false;
    }
    return true;
  });
}
