'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Metrics } from '@/lib/api/types';
import { formatMonth, formatNumber } from '@/lib/format';
import { CHART, legendLabelStyle } from '@/lib/chart-theme';
import { Card } from '../ui/Card';

/** Reuniones por mes, separando las que terminaron en venta. */
export function TimelineChart({ data }: { data: Metrics['timeline'] }) {
  const rows = data.map((point) => ({
    label: formatMonth(point.month),
    closed: point.closed,
    open: point.count - point.closed,
  }));

  return (
    <Card
      title="Reuniones por mes"
      subtitle="Cuántas reuniones hubo y cuántas terminaron en venta"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis
              dataKey="label"
              tick={CHART.axisTick}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={CHART.axisTick} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(value, name) => [formatNumber(Number(value)), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span style={legendLabelStyle}>{value}</span>
              )}
            />
            <Bar
              dataKey="closed"
              name="Con venta"
              stackId="meetings"
              fill={CHART.series.primary}
              stroke={CHART.surface}
              strokeWidth={1}
            />
            <Bar
              dataKey="open"
              name="Sin venta"
              stackId="meetings"
              fill={CHART.series.primaryLight}
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
