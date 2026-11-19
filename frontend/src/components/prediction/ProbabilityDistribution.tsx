'use client';

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

const bucketLabel = (from: number) => `${Math.round(from * 100)}%`;

/**
 * Cuántos clientes cerraron y cuántos no, según la probabilidad que les
 * asignó el modelo. Si el modelo sirve, a la derecha (más probabilidad)
 * debería haber proporcionalmente más azul.
 */
export function ProbabilityDistribution({
  buckets,
  baseRate,
}: {
  buckets: Prediction['buckets'];
  baseRate: number;
}) {
  // Solo el tramo con datos, para no mostrar barras vacías en los extremos.
  const first = buckets.findIndex((b) => b.closed + b.open > 0);
  const last = buckets.findLastIndex((b) => b.closed + b.open > 0);
  const rows = buckets.slice(first, last + 1).map((b) => ({
    label: bucketLabel(b.from),
    range: `${bucketLabel(b.from)}–${bucketLabel(b.to)}`,
    closed: b.closed,
    open: b.open,
    closeRate: b.closed + b.open ? b.closed / (b.closed + b.open) : 0,
  }));
  const averageBucket = bucketLabel(Math.floor(baseRate * 20) / 20);

  return (
    <Card
      title="Cerraron vs. no cerraron, según su probabilidad"
      subtitle="Cada barra agrupa a los clientes a los que el modelo les asignó una probabilidad parecida. Hacia la derecha debería haber proporcionalmente más clientes que cerraron."
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
                value: 'Probabilidad de cierre estimada',
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
                const row = payload[0].payload as (typeof rows)[number];
                return (
                  <div className="border-border bg-surface rounded-lg border px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">Probabilidad {row.range}</p>
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
