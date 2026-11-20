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
  format: (month: MonthKpis) => string,
  change: (month: MonthKpis) => Change,
): ComparisonRow[] {
  return [comparison.previousMonth, comparison.sameMonthLastYear].map(
    (month) => ({
      label: `vs. ${formatMonthYear(month.month)}`,
      value: month.meetings ? format(month) : null,
      ...(month.meetings ? change(month) : NO_CHANGE),
    }),
  );
}

/** Reuniones del mes vs. los meses de referencia (cambio en %). */
export function meetingsComparison(comparison: Comparison): ComparisonRow[] {
  const current = comparison.current.meetings;
  return compareWith(
    comparison,
    (month) => formatNumber(month.meetings),
    (month) => ({
      text: formatChange(current, month.meetings),
      direction: Math.sign(current - month.meetings),
    }),
  );
}

/** Tasa de cierre del mes vs. los meses de referencia (cambio en puntos). */
export function closeRateComparison(comparison: Comparison): ComparisonRow[] {
  const current = comparison.current.closeRate;
  return compareWith(
    comparison,
    (month) => formatPct(month.closeRate),
    (month) =>
      current === null || month.closeRate === null
        ? NO_CHANGE
        : {
            text: formatPointsDiff(current, month.closeRate),
            direction: Math.sign(pointsDiff(current, month.closeRate)),
          },
  );
}
