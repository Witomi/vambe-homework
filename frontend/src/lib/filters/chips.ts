import type { Labeler } from '../labels';
import { listParam } from './params';

/** Un filtro activo, mostrado como "chip" que se puede quitar. */
export interface FilterChip {
  key: string;
  value: string;
  /** Nombre del filtro: "Industria", "Vendedor"… */
  group: string;
  /** Valor legible: "Salud / Clínicas" */
  label: string;
  /** Si es de lista, quitar el chip remueve solo este valor. */
  multi: boolean;
}

const single = (key: string, value: string, group: string, label = value) => ({
  key,
  value,
  group,
  label,
  multi: false,
});

const many = (
  params: URLSearchParams,
  key: string,
  group: string,
  labelOf: (value: string) => string = (v) => v,
): FilterChip[] =>
  listParam(params, key).map((value) => ({
    key,
    value,
    group,
    label: labelOf(value),
    multi: true,
  }));

/** Convierte los filtros activos de la URL en chips legibles. */
export function buildFilterChips(
  params: URLSearchParams,
  labels: Labeler,
  dimensionKeys: string[],
): FilterChip[] {
  const chips: FilterChip[] = [];
  const search = params.get('search');
  const closed = params.get('closed');
  const from = params.get('from');
  const to = params.get('to');

  if (search) chips.push(single('search', search, 'Búsqueda', `“${search}”`));
  if (params.get('categorized') === 'true') {
    chips.push(single('categorized', 'true', 'IA', 'Solo categorizadas'));
  }
  if (closed) {
    const label = closed === 'true' ? 'Cerrados' : 'No cerrados';
    chips.push(single('closed', closed, 'Estado', label));
  }
  if (from) chips.push(single('from', from, 'Desde'));
  if (to) chips.push(single('to', to, 'Hasta'));

  chips.push(...many(params, 'sellers', 'Vendedor'));
  chips.push(
    ...many(params, 'volume', 'Volumen', (v) => labels.value('volume', v)),
  );
  for (const key of dimensionKeys) {
    chips.push(
      ...many(params, key, labels.dimension(key), (v) => labels.value(key, v)),
    );
  }
  return chips;
}
