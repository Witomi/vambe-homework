'use client';

import {
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Metrics } from '@/lib/api/types';
import { CHART } from '@/lib/chart-theme';
import { formatNumber, formatPct } from '@/lib/format';
import {
  MINI_CHART_MARGIN,
  MiniTooltip,
  activeDotProps,
  monthAxisProps,
  selectedDotProps,
} from './MiniChart';

type Point = Metrics['timeline'][number];

/**
 * Tasa de cierre de cada mes, con la del período como línea punteada.
 * Línea y no barras: la tasa varía pocos puntos y con barras desde 0 no
 * se notaría la diferencia.
 */
export function MonthlyCloseRateLine({
  timeline,
  month,
  average,
}: {
  timeline: Metrics['timeline'];
  /** Mes elegido; null en modo histórico. */
  month: string | null;
  /** Tasa de todo el período. */
  average: number | null;
}) {
  if (timeline.length < 2) return null;
  const selected = timeline.find((p) => p.month === month);

  return (
    <div className="mt-3 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={timeline} margin={MINI_CHART_MARGIN}>
          <XAxis {...monthAxisProps} />
          <YAxis hide domain={['dataMin - 0.02', 'dataMax + 0.02']} />
          {average !== null && (
            <ReferenceLine
              y={average}
              stroke={CHART.text}
              strokeOpacity={0.5}
              strokeDasharray="3 3"
            />
          )}
          <Tooltip
            cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
            content={<RateTooltip />}
          />
          <Line
            dataKey="closeRate"
            stroke={CHART.series.primary}
            strokeWidth={2}
            dot={false}
            activeDot={activeDotProps}
            isAnimationActive={false}
          />
          {selected?.closeRate != null && (
            <ReferenceDot
              x={selected.month}
              y={selected.closeRate}
              {...selectedDotProps}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Point }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <MiniTooltip
      month={point.month}
      lines={[
        `Tasa de cierre: ${formatPct(point.closeRate)}`,
        `${formatNumber(point.closed)} de ${formatNumber(point.count)} reuniones`,
      ]}
    />
  );
}
