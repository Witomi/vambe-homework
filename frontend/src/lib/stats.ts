/**
 * Rango probable de una tasa (intervalo de Wilson al 95%).
 *
 * Con pocas reuniones una tasa es poco confiable: 3 de 3 es "100%", pero
 * el valor real podría estar entre 44% y 100%. Este rango lo hace visible.
 *
 * @param zScore 1,96 corresponde a un 95% de confianza.
 */
export function wilsonInterval(
  successes: number,
  total: number,
  zScore = 1.96,
): { low: number; high: number } {
  if (total === 0) return { low: 0, high: 1 };
  const rate = successes / total;
  const zSquared = zScore * zScore;
  const center = (rate + zSquared / (2 * total)) / (1 + zSquared / total);
  const margin =
    (zScore / (1 + zSquared / total)) *
    Math.sqrt((rate * (1 - rate)) / total + zSquared / (4 * total * total));
  return {
    low: Math.max(0, center - margin),
    high: Math.min(1, center + margin),
  };
}
