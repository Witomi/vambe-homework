'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Prediction } from '@/lib/api/types';
import { formatPct } from '@/lib/format';
import { Card } from '../ui/Card';

/** Rangos con menos clientes se omiten: su tasa real es muy ruidosa. */
const MIN_BUCKET = 20;
const AXIS = { fontSize: 11, fill: '#52514e' };

/**
 * ¿Se puede confiar en las probabilidades? Compara, por rango, lo que
 * predijo el modelo con lo que realmente pasó. Si las líneas van juntas,
 * un "75%" del modelo significa de verdad ~75%.
 */
export function CalibrationChart({
  buckets,
}: {
  buckets: Prediction['buckets'];
}) {
  const rows = buckets
    .filter((b) => b.closed + b.open >= MIN_BUCKET)
    .map((b) => ({
      label: `${Math.round(b.from * 100)}%`,
      predicted: b.meanPredicted,
      actual: b.closed / (b.closed + b.open),
      count: b.closed + b.open,
    }));

  return (
    <Card
      title="¿Se puede confiar en las probabilidades?"
      subtitle={`Lo que predijo el modelo frente a lo que realmente pasó, en rangos con al menos ${MIN_BUCKET} clientes. Si las líneas van juntas, el modelo está bien calibrado.`}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 8, left: -12 }}>
            <CartesianGrid vertical={false} stroke="#ecebe7" />
            <XAxis
              dataKey="label"
              tick={AXIS}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              domain={[0.4, 0.9]}
              ticks={[0.4, 0.5, 0.6, 0.7, 0.8, 0.9]}
              tickFormatter={(v: number) => formatPct(v)}
            />
            <Tooltip
              formatter={(value, name) => [formatPct(Number(value)), name]}
              labelFormatter={(label) => `Rango desde ${label}`}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) => (
                <span style={{ color: '#52514e' }}>{value}</span>
              )}
            />
            <Line
              isAnimationActive={false}
              type="linear"
              dataKey="predicted"
              name="Predicho"
              stroke="#8a8984"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              isAnimationActive={false}
              type="linear"
              dataKey="actual"
              name="Real"
              stroke="#2a78d6"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 0, fill: '#2a78d6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
