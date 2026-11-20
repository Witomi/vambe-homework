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

/** Divide una lista en grupos de `size` elementos (el último puede ser menor). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Mediana de una lista de números, o null si está vacía. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
