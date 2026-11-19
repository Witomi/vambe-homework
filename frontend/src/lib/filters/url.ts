import type { SearchParams } from './params';

/** Construye un href a partir de los parámetros actuales con cambios aplicados. */
export function hrefWith(
  pathname: string,
  params: SearchParams,
  changes: Record<string, string | number | null>,
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const str = Array.isArray(value) ? value.join(',') : value;
    if (str) next.set(key, str);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === '') next.delete(key);
    else next.set(key, String(value));
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Enlace a la tabla de clientes analizados con IA, filtrada. `origin` marca
 * la página de partida para que el destino muestre "← Volver a …".
 */
export function clientsHref(
  filter: Record<string, string>,
  origin: string,
): string {
  const query = new URLSearchParams({
    ...filter,
    categorized: 'true',
    origin,
  });
  return `/clientes?${query.toString()}`;
}
