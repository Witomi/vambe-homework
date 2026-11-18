/**
 * Agrupa elementos por una o más claves. Un elemento con varias claves
 * (p. ej. una dimensión multivalor) aparece en cada grupo.
 */
export function groupBy<T>(
  items: readonly T[],
  keysOf: (item: T) => string[],
): Map<string, T[]> {
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

/** Mediana de una lista de números, o null si está vacía. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
