'use client';

import { MessagesSquare } from 'lucide-react';
import {
  Area,
  AreaChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import type { Metrics } from '@/lib/api/types';
import { CHART } from '@/lib/chart-theme';
import { formatCompact, formatMonthYear, formatPct } from '@/lib/format';
import { cumulativeInquiries, type CumulativePoint } from '@/lib/metrics';
import {
  MINI_CHART_MARGIN,
  MiniTooltip,
  activeDotProps,
  monthAxisProps,
  selectedDotProps,
} from './MiniChart';

/**
 * Acumulado de las consultas al mes que traen los clientes que van
 * comprando: cuánto volumen atiende Vambe y cómo creció. Con un mes elegido,
 * la cifra y el punto marcan el acumulado hasta ese mes.
 */
export function AutomatedInquiriesChart({
  kpis,
  timeline,
  month,
}: {
  kpis: Metrics['kpis'];
  timeline: Metrics['timeline'];
  /** Mes elegido; null en modo histórico (se usa el último). */
  month: string | null;
}) {
  const data = cumulativeInquiries(timeline);
  const selected =
    data.find((p) => p.month === month) ?? data[data.length - 1] ?? null;
  const estimated = kpis.categorized < kpis.meetings;
  const approx = estimated ? '≈ ' : '';

  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="text-muted flex items-center gap-1.5 text-sm">
        <MessagesSquare className="size-4" aria-hidden />
        Consultas automatizadas acumuladas
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {selected ? `${approx}${formatCompact(selected.total)}` : '—'}
      </div>
      <div className="text-subtle mt-1 text-sm">
        {selected
          ? `consultas al mes hasta ${formatMonthYear(selected.month)} · ${approx}+${formatCompact(selected.added)} nuevas ese mes`
          : 'sin reuniones analizadas'}
      </div>

      {data.length > 1 && (
        <div className="mt-3 h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={MINI_CHART_MARGIN}>
              <XAxis {...monthAxisProps} />
              <Tooltip
                cursor={{ stroke: CHART.grid, strokeWidth: 1 }}
                content={<InquiriesTooltip approx={approx} />}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={CHART.series.primary}
                strokeWidth={2}
                fill={CHART.series.primaryLight}
                fillOpacity={0.5}
                isAnimationActive={false}
                activeDot={activeDotProps}
              />
              {selected && (
                <ReferenceDot
                  x={selected.month}
                  y={selected.total}
                  {...selectedDotProps}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {estimated && kpis.categorized > 0 && (
        <p className="text-subtle mt-auto pt-3 text-xs">
          Estimado con el {formatPct(kpis.coverage)} de las reuniones analizadas
          con IA.
        </p>
      )}
    </div>
  );
}

function InquiriesTooltip({
  active,
  payload,
  approx,
}: {
  active?: boolean;
  payload?: { payload: CumulativePoint }[];
  approx: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <MiniTooltip
      month={point.month}
      lines={[
        `Nuevas: ${approx}${formatCompact(point.added)}`,
        `Acumulado: ${approx}${formatCompact(point.total)}`,
      ]}
    />
  );
}
