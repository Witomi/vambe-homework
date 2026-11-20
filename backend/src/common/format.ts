/** Formato de números para textos en español (Chile). */

/** Porcentaje entero tal como se muestra: 0.676 → 68. */
export const displayedPct = (rate: number): number => Math.round(rate * 100);

/** 0.676 → "68%" */
export const formatPct = (rate: number): string => `${displayedPct(rate)}%`;
