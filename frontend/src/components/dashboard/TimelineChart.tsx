'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMonth, formatNumber, formatPct } from '@/lib/format';
import type { Metrics } from '@/lib/types';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';

type View = 'volume' | 'rate';

const AXIS = { fontSize: 11, fill: '#52514e' };
const COLORS = { closed: '#2a78d6', open: '#b7d3f6', grid: '#ecebe7' };

/**
 * Evolución mensual. Volumen y tasa tienen escalas distintas, así que se
 * muestran como vistas separadas en vez de un gráfico de doble eje.
 */
export function TimelineChart({ data }: { data: Metrics['timeline'] }) {
  const [view, setView] = useState<View>('volume');
  const rows = data.map((d) => ({
    ...d,
    label: formatMonth(d.month),
    open: d.count - d.closed,
  }));

  return (
    <Card
      title="Evolución mensual"
      subtitle={
        view === 'volume'
          ? 'Reuniones por mes según resultado'
          : 'Porcentaje de reuniones que terminan en venta'
      }
      action={
        <Tabs<View>
          value={view}
          onChange={setView}
          options={[
            { value: 'volume', label: 'Reuniones' },
            { value: 'rate', label: 'Tasa de cierre' },
          ]}
        />
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'volume' ? (
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
                name="Cerradas"
                stackId="a"
                fill={COLORS.closed}
                stroke="#fff"
                strokeWidth={1}
              />
              <Bar
                dataKey="open"
                name="No cerradas"
                stackId="a"
                fill={COLORS.open}
                stroke="#fff"
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart
              data={rows}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke={COLORS.grid} />
              <XAxis
                dataKey="label"
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={AXIS}
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
                tickFormatter={(v: number) => formatPct(v)}
              />
              <Tooltip
                formatter={(value) => [
                  formatPct(Number(value), 1),
                  'Tasa de cierre',
                ]}
              />
              <Line
                type="monotone"
                dataKey="closeRate"
                name="Tasa de cierre"
                stroke={COLORS.closed}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: COLORS.closed }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
