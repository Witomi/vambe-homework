/**
 * Muestreo reproducible: mezclas aleatorias que dan siempre el mismo orden
 * con la misma semilla. Se usa donde el resultado debe ser estable entre
 * ejecuciones: las partes de la validación cruzada (para que las notas no
 * cambien solas) y la elección de los casos del gold.
 */

/**
 * Generador pseudoaleatorio determinista (mulberry32): devuelve números
 * entre 0 y 1, siempre la misma secuencia para la misma semilla. Las
 * constantes y desplazamientos son los del algoritmo original.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mezcla con la misma semilla, el mismo orden (Fisher-Yates). */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const random = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const swapWith = Math.floor(random() * (i + 1));
    [result[i], result[swapWith]] = [result[swapWith], result[i]];
  }
  return result;
}
