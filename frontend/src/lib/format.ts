const numberFormat = new Intl.NumberFormat('es-CL');
const compactFormat = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : numberFormat.format(Math.round(value));

export const formatCompact = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : compactFormat.format(value);

/** Número con decimales fijos en formato chileno: 1.234 → "1,2". */
export const formatDecimal = (value: number, digits = 1) =>
  new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

/** Tasa como porcentaje: 0.6888 → "69%" (o "68,9%" con 1 decimal). */
export const formatPct = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined
    ? '—'
    : `${formatDecimal(value * 100, digits)}%`;

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
  const points = pointsDiff(rate, base);
  const sign = points > 0 ? '+' : points < 0 ? '−' : '±';
  return `${sign}${Math.abs(points)} pts`;
};

/**
 * Cambio relativo entre dos cantidades: (270, 407) → "−34%".
 * Null si no hay base con qué comparar.
 */
export const formatChange = (current: number, previous: number) => {
  if (previous === 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  const sign = percent > 0 ? '+' : percent < 0 ? '−' : '±';
  return `${sign}${Math.abs(percent)}%`;
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
export const formatMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  return `${MONTHS[Number(month) - 1]} ${year.slice(2)}`;
};

/** "2025-03" → "mar 2025" */
export const formatMonthYear = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
};

/** Celular chileno sin formato: "56976545678" → "+56 9 7654 5678". */
export const formatPhone = (raw: string) => {
  const match = /^56(9)(\d{4})(\d{4})$/.exec(raw);
  return match ? `+56 ${match[1]} ${match[2]} ${match[3]}` : raw;
};

/** Teléfono listo para marcar o pegar: "56976545678" → "+56976545678". */
export const dialablePhone = (raw: string) =>
  /^\d+$/.test(raw) ? `+${raw}` : raw;

/** "2024-03-15" → "15 mar 2024" */
export const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
};
