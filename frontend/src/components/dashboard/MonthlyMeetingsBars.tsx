'use client';

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { Metrics } from '@/lib/api/types';
import { CHART } from '@/lib/chart-theme';
import { formatNumber, formatPct } from '@/lib/format';
import { MINI_CHART_MARGIN, MiniTooltip, monthAxisProps } from './MiniChart';

type Point = Metrics['timeline'][number];

/**
 * Reuniones de cada mes (no acumuladas), con el mes elegido destacado.
 * En modo histórico todas las barras van igual.
 */
export function MonthlyMeetingsBars({
  timeline,
  month,
}: {
  timeline: Metrics['timeline'];
  /** Mes elegido; null en modo histórico. */
  month: string | null;
}) {
  if (timeline.length < 2) return null;

  return (
    <div className="mt-3 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={timeline} margin={MINI_CHART_MARGIN} barCategoryGap={2}>
          <XAxis {...monthAxisProps} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={<MeetingsTooltip />}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {timeline.map((point) => (
              <Cell
                key={point.month}
                fill={
                  month === null || point.month === month
                    ? CHART.series.primary
                    : CHART.series.primaryLight
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MeetingsTooltip({
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
        `Reuniones: ${formatNumber(point.count)}`,
        `Con venta: ${formatNumber(point.closed)} (${formatPct(point.closeRate)})`,
      ]}
    />
  );
}
