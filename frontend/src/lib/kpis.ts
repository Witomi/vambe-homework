import type { Metrics } from './api/types';
import {
  formatChange,
  formatMonthYear,
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from './format';

type Comparison = NonNullable<Metrics['monthComparison']>;
type MonthKpis = Comparison['current'];

/** Una fila "vs. feb 2025 · 407 · −34%" de una tarjeta de cifras clave. */
export interface ComparisonRow {
  label: string;
  /** null: no hubo reuniones ese mes en el segmento. */
  value: string | null;
  /** Cambio respecto de ese mes; null si no se puede calcular. */
  text: string | null;
  /** Signo del cambio (−1, 0 o 1): decide flecha y color. */
  direction: number;
}

type Change = Pick<ComparisonRow, 'text' | 'direction'>;
const NO_CHANGE: Change = { text: null, direction: 0 };

/** Compara el mes elegido con el anterior y con el mismo mes del año pasado. */
function compareWith(
  comparison: Comparison,
  format: (m: MonthKpis) => string,
  change: (m: MonthKpis) => Change,
): ComparisonRow[] {
  return [comparison.previousMonth, comparison.sameMonthLastYear].map((m) => ({
    label: `vs. ${formatMonthYear(m.month)}`,
    value: m.meetings ? format(m) : null,
    ...(m.meetings ? change(m) : NO_CHANGE),
  }));
}

/** Reuniones del mes vs. los meses de referencia (cambio en %). */
export function meetingsComparison(comparison: Comparison): ComparisonRow[] {
  const current = comparison.current.meetings;
  return compareWith(
    comparison,
    (m) => formatNumber(m.meetings),
    (m) => ({
      text: formatChange(current, m.meetings),
      direction: Math.sign(current - m.meetings),
    }),
  );
}

/** Tasa de cierre del mes vs. los meses de referencia (cambio en puntos). */
export function closeRateComparison(comparison: Comparison): ComparisonRow[] {
  const current = comparison.current.closeRate;
  return compareWith(
    comparison,
    (m) => formatPct(m.closeRate),
    (m) =>
      current === null || m.closeRate === null
        ? NO_CHANGE
        : {
            text: formatPointsDiff(current, m.closeRate),
            direction: Math.sign(pointsDiff(current, m.closeRate)),
          },
  );
}
