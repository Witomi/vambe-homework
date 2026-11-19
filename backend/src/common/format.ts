/** Formato de números para textos en español (Chile). */

const decimal = (digits: number) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** Porcentaje entero tal como se muestra: 0.676 → 68. */
export const displayedPct = (rate: number): number => Math.round(rate * 100);

/** 0.676 → "68%" */
export const formatPct = (rate: number): string => `${displayedPct(rate)}%`;

/** Razón de chances: 1.234 → "×1,2" */
export const formatOdds = (odds: number, digits = 1): string =>
  `×${decimal(digits).format(odds)}`;
