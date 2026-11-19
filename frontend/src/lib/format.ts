const numberFormat = new Intl.NumberFormat('es-CL');
const compactFormat = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : numberFormat.format(Math.round(n));

export const formatCompact = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : compactFormat.format(n);

/** Número con decimales fijos en formato chileno: 1.234 → "1,2". */
export const formatDecimal = (n: number, digits = 1) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);

/** Tasa como porcentaje: 0.6888 → "69%" (o "68,9%" con 1 decimal). */
export const formatPct = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined ? '—' : `${formatDecimal(n * 100, digits)}%`;

/** Razón de chances: 1.234 → "×1,23". */
export const formatOdds = (odds: number, digits = 2) =>
  `×${formatDecimal(odds, digits)}`;

/** Porcentaje entero tal como se muestra en pantalla: 0.676 → 68. */
export const displayedPct = (rate: number) => Math.round(rate * 100);

/**
 * Diferencia en puntos entre dos tasas, calculada sobre los porcentajes ya
 * redondeados para que siempre cuadre con lo que se ve: 69% vs. 68% → "+1 pts".
 * (Se usan puntos y no "%" para no confundirlo con un aumento relativo.)
 */
export const pointsDiff = (rate: number, base: number) =>
  displayedPct(rate) - displayedPct(base);

export const formatPointsDiff = (rate: number, base: number) => {
  const pts = pointsDiff(rate, base);
  const sign = pts > 0 ? '+' : pts < 0 ? '−' : '±';
  return `${sign}${Math.abs(pts)} pts`;
};

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** "2024-03" → "mar 24" */
export const formatMonth = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
};

/** "2024-03-15" → "15 mar 2024" */
export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
};
