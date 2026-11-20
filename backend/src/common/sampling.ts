/**
 * Muestreo reproducible: mezclas aleatorias que dan siempre el mismo orden
 * con la misma semilla. Se usa donde el resultado debe ser estable entre
 * ejecuciones: las partes de la validación cruzada (para que las notas no
 * cambien solas) y la elección de los casos del gold.
 */

/** Generador pseudoaleatorio determinista (mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla con la misma semilla, el mismo orden (Fisher-Yates). */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
