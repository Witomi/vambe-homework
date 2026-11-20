import { CHART } from '@/lib/chart-theme';
import { formatMonth, formatMonthYear } from '@/lib/format';

/**
 * Piezas compartidas por los gráficos pequeños de las cifras clave:
 * mismo alto, eje de meses y tooltip.
 */

export const MINI_CHART_MARGIN = { top: 6, right: 6, left: 6, bottom: 0 };

/** Eje X de meses: solo algunas etiquetas para no amontonar. */
export const monthAxisProps = {
  dataKey: 'month',
  tickFormatter: formatMonth,
  tick: CHART.axisTick,
  tickLine: false,
  axisLine: { stroke: CHART.grid },
  interval: 'preserveStartEnd',
  minTickGap: 40,
} as const;

/** Punto que aparece al pasar el mouse por la línea. */
export const activeDotProps = {
  r: 4,
  stroke: CHART.surface,
  strokeWidth: 2,
} as const;

/** Punto destacado del mes elegido (≥ 8px, con anillo de la superficie). */
export const selectedDotProps = {
  r: 4,
  fill: CHART.series.primary,
  stroke: CHART.surface,
  strokeWidth: 2,
} as const;

/** Caja del tooltip: el mes como título y una línea por dato. */
export function MiniTooltip({
  month,
  lines,
}: {
  month: string;
  lines: string[];
}) {
  return (
    <div className="border-border bg-surface rounded-lg border px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{formatMonthYear(month)}</p>
      {lines.map((line) => (
        <p key={line} className="text-muted">
          {line}
        </p>
      ))}
    </div>
  );
}
