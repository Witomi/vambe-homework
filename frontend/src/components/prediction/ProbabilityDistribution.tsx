'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Prediction } from '@/lib/api/types';
import { formatNumber, formatPct } from '@/lib/format';
import { CHART, legendLabelStyle } from '@/lib/chart-theme';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';

type View = 'probability' | 'grade';

/** Una barra: un grupo de clientes y cuántos cerraron. */
interface Row {
  label: string;
  /** Título del tooltip. */
  title: string;
  closed: number;
  open: number;
  closeRate: number;
}

const VIEWS: Record<View, { subtitle: string; axis: string }> = {
  probability: {
    subtitle:
      'Cada barra agrupa a los clientes a los que el modelo les asignó una probabilidad parecida.',
    axis: 'Probabilidad de cierre estimada',
  },
  grade: {
    subtitle:
      'Cada barra es una nota, de menor (F) a mayor (A) probabilidad de cierre.',
    axis: 'Nota',
  },
};

const bucketLabel = (from: number) => `${Math.round(from * 100)}%`;
const rateOf = (closed: number, open: number) =>
  closed + open ? closed / (closed + open) : 0;

function probabilityRows(buckets: Prediction['buckets']): Row[] {
  // Solo el tramo con datos, para no mostrar barras vacías en los extremos.
  const first = buckets.findIndex((b) => b.closed + b.open > 0);
  const last = buckets.findLastIndex((b) => b.closed + b.open > 0);
  return buckets.slice(first, last + 1).map((b) => ({
    label: bucketLabel(b.from),
    title: `Probabilidad ${bucketLabel(b.from)}–${bucketLabel(b.to)}`,
    closed: b.closed,
    open: b.open,
    closeRate: rateOf(b.closed, b.open),
  }));
}

function gradeRows(grades: Prediction['grades']): Row[] {
  // De menor a mayor probabilidad, igual que la vista por probabilidad.
  return [...grades].reverse().map((g) => ({
    label: g.grade,
    title: `Nota ${g.grade} · ${g.title} (${g.range})`,
    closed: g.closed,
    open: g.count - g.closed,
    closeRate: rateOf(g.closed, g.count - g.closed),
  }));
}

/**
 * Cuántos clientes cerraron y cuántos no, agrupados por la probabilidad que
 * les asignó el modelo o por su nota.
 */
export function ProbabilityDistribution({
  buckets,
  grades,
  baseRate,
}: {
  buckets: Prediction['buckets'];
  grades: Prediction['grades'];
  baseRate: number;
}) {
  const [view, setView] = useState<View>('probability');
  const rows =
    view === 'probability' ? probabilityRows(buckets) : gradeRows(grades);
  const averageBucket = bucketLabel(Math.floor(baseRate * 20) / 20);

  return (
    <Card
      title="Cerraron vs. no cerraron"
      subtitle={VIEWS[view].subtitle}
      action={
        <Tabs<View>
          value={view}
          onChange={setView}
          options={[
            { value: 'probability', label: 'Por probabilidad' },
            { value: 'grade', label: 'Por nota' },
          ]}
        />
      }
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 28, right: 8, left: -12, bottom: 16 }}
          >
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="label"
              tick={CHART.axisTick}
              tickLine={false}
              axisLine={false}
              label={{
                value: VIEWS[view].axis,
                position: 'insideBottom',
                offset: -10,
                fontSize: 11,
                fill: CHART.text,
              }}
            />
            <YAxis tick={CHART.axisTick} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Row;
                return (
                  <div className="border-border bg-surface rounded-lg border px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-brand-strong">
                      Cerraron: {formatNumber(row.closed)}
                    </p>
                    <p className="text-negative-strong">
                      No cerraron: {formatNumber(row.open)}
                    </p>
                    <p className="text-muted mt-1">
                      Cerró el {formatPct(row.closeRate)} de este grupo
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 20 }}
              formatter={(value: string) => (
                <span style={legendLabelStyle}>{value}</span>
              )}
            />
            {view === 'probability' && (
              <ReferenceLine
                x={averageBucket}
                stroke={CHART.text}
                strokeDasharray="4 3"
                label={{
                  value: `Promedio ${formatPct(baseRate)}`,
                  position: 'top',
                  fontSize: 11,
                  fill: CHART.text,
                }}
              />
            )}
            <Bar
              isAnimationActive={false}
              dataKey="closed"
              name="Cerraron"
              stackId="clients"
              fill={CHART.series.primary}
              stroke={CHART.surface}
              strokeWidth={1}
            />
            <Bar
              isAnimationActive={false}
              dataKey="open"
              name="No cerraron"
              stackId="clients"
              fill={CHART.series.negative}
              stroke={CHART.surface}
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
