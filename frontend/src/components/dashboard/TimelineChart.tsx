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
import { Card } from '../ui/Card';

const AXIS = { fontSize: 11, fill: '#52514e' };
const COLORS = { closed: '#2a78d6', open: '#b7d3f6', grid: '#ecebe7' };

/** Reuniones por mes, separando las que terminaron en venta. */
export function TimelineChart({ data }: { data: Metrics['timeline'] }) {
  const rows = data.map((d) => ({
    label: formatMonth(d.month),
    closed: d.closed,
    open: d.count - d.closed,
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
            <CartesianGrid vertical={false} stroke={COLORS.grid} />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(value, name) => [formatNumber(Number(value)), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span style={{ color: '#52514e' }}>{value}</span>
              )}
            />
            <Bar
              dataKey="closed"
              name="Con venta"
              stackId="meetings"
              fill={COLORS.closed}
              stroke="#fff"
              strokeWidth={1}
            />
            <Bar
              dataKey="open"
              name="Sin venta"
              stackId="meetings"
              fill={COLORS.open}
              stroke="#fff"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
