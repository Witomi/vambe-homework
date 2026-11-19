/**
 * Rango probable de una tasa (intervalo de Wilson al 95%).
 *
 * Con pocas reuniones una tasa es poco confiable: 3 de 3 es "100%", pero
 * el valor real podría estar entre 44% y 100%. Este rango lo hace visible.
 */
export function wilsonInterval(
  successes: number,
  total: number,
  z = 1.96,
): { low: number; high: number } {
  if (total === 0) return { low: 0, high: 1 };
  const p = successes / total;
  const z2 = z * z;
  const center = (p + z2 / (2 * total)) / (1 + z2 / total);
  const margin =
    (z / (1 + z2 / total)) *
    Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total));
  return {
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
  };
}
