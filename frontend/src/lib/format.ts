const numberFormat = new Intl.NumberFormat('es-CL');
const compactFormat = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatNumber = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : numberFormat.format(Math.round(n));

export const formatCompact = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : compactFormat.format(n);

export const formatPct = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined ? '—' : `${(n * 100).toFixed(digits)}%`;

/** Diferencia en puntos porcentuales: +4 pp / −3 pp */
export const formatPp = (n: number) => {
  const pp = Math.round(n * 100);
  return `${pp > 0 ? '+' : pp < 0 ? '−' : '±'}${Math.abs(pp)} pp`;
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
