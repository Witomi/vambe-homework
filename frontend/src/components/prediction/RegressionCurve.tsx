'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from 'recharts';
import type { ClientPoint, Prediction } from '@/lib/api/types';
import { formatPct } from '@/lib/format';
import { Card } from '../ui/Card';

const COLORS = { closed: '#2a78d6', open: '#e34948', curve: '#0b0b0b' };
const AXIS = { fontSize: 11, fill: '#52514e' };
/** Separación vertical de los puntos para que no se tapen entre sí. */
const JITTER = 0.07;
/** Margen a cada lado de los datos para que se vea la forma de S. */
const CURVE_PADDING = 0.8;

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Desplazamiento estable (mismo cliente, misma posición) a partir del id. */
function jitter(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ((Math.abs(hash) % 1000) / 1000) * JITTER;
}

interface PlotPoint extends ClientPoint {
  x: number;
  y: number;
}

/**
 * Curva de la regresión logística con cada cliente como punto: arriba los
 * que cerraron, abajo los que no. Las bandas de fondo marcan las notas.
 * Los puntos rojos a la derecha son leads perdidos con alta probabilidad.
 */
export function RegressionCurve({
  points,
  thresholds,
}: {
  points: Prediction['points'];
  thresholds: Prediction['gradeThresholds'];
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState<PlotPoint | null>(null);

  // Recharts entrega el punto en `payload`.
  const pointOf = (item: { payload?: unknown }) =>
    item.payload as PlotPoint | undefined;
  const openClient = (item: { payload?: unknown }) => {
    const point = pointOf(item);
    if (point) router.push(`/clientes?cliente=${point.id}`);
  };
  const showClient = (item: { payload?: unknown }) =>
    setHovered(pointOf(item) ?? null);

  const scores = points.map((p) => p.score);
  const minX = Math.floor((Math.min(...scores) - CURVE_PADDING) * 2) / 2;
  const maxX = Math.ceil((Math.max(...scores) + CURVE_PADDING) * 2) / 2;

  const ticks = Array.from(
    { length: Math.round((maxX - minX) / 0.5) + 1 },
    (_, i) => minX + i * 0.5,
  );
  const curve = Array.from({ length: 81 }, (_, i) => {
    const x = minX + ((maxX - minX) * i) / 80;
    return { x, curve: sigmoid(x) };
  });
  const toPlot = (p: ClientPoint): PlotPoint => ({
    ...p,
    x: p.score,
    y: p.closed ? 1 - jitter(p.id) : jitter(p.id),
  });
  const closed = points.filter((p) => p.closed).map(toPlot);
  const open = points.filter((p) => !p.closed).map(toPlot);

  // Bandas de notas: cada una va desde su puntaje mínimo hasta el de la nota superior.
  const bands = thresholds.map((t, i) => ({
    grade: t.grade,
    from: t.minScore ?? minX,
    to: i === 0 ? maxX : (thresholds[i - 1].minScore ?? maxX),
  }));

  return (
    <Card
      title="Cada cliente sobre la curva del modelo"
      subtitle="La curva convierte el puntaje de cada cliente (la suma de sus rasgos) en probabilidad de cierre. Arriba, los que cerraron; abajo, los que no. Los puntos rojos a la derecha son leads perdidos con alta probabilidad. Haz clic en un punto para abrir el cliente."
    >
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 40, right: 12, left: 4, bottom: 16 }}>
            <CartesianGrid stroke="#ecebe7" vertical={false} />
            {bands.map((band, i) => (
              <ReferenceArea
                key={band.grade}
                x1={band.from}
                x2={band.to}
                fill={i % 2 === 0 ? '#e8f1fc' : '#f6f6f4'}
                fillOpacity={0.6}
                stroke="none"
                label={{
                  value: `Nota ${band.grade}`,
                  position: 'top',
                  fontSize: 11,
                  fill: '#1c5cab',
                }}
              />
            ))}
            <XAxis
              type="number"
              dataKey="x"
              domain={[minX, maxX]}
              ticks={ticks}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => v.toFixed(1).replace('.', ',')}
              label={{
                value: 'Puntaje del cliente según el modelo →',
                position: 'insideBottom',
                offset: -8,
                fontSize: 11,
                fill: '#52514e',
              }}
            />
            <YAxis
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatPct(v)}
              width={44}
            />
            <Legend
              verticalAlign="top"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingBottom: 28 }}
              formatter={(value: string) => (
                <span style={{ color: '#52514e' }}>{value}</span>
              )}
            />
            <Scatter
              name="Cerraron"
              dataKey="y"
              data={closed}
              fill={COLORS.closed}
              fillOpacity={0.45}
              shape="circle"
              isAnimationActive={false}
              onClick={openClient}
              onMouseEnter={showClient}
              cursor="pointer"
            />
            <Scatter
              name="No cerraron"
              dataKey="y"
              data={open}
              fill={COLORS.open}
              fillOpacity={0.45}
              shape="circle"
              isAnimationActive={false}
              onClick={openClient}
              onMouseEnter={showClient}
              cursor="pointer"
            />
            <Line
              data={curve}
              dataKey="curve"
              name="Probabilidad según el modelo"
              stroke={COLORS.curve}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="plainline"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <HoveredClient point={hovered} />
    </Card>
  );
}

/** Línea fija bajo el gráfico con el cliente bajo el mouse (no tapa los puntos). */
function HoveredClient({ point }: { point: PlotPoint | null }) {
  return (
    <p
      aria-live="polite"
      className="border-border bg-background mt-2 min-h-10 rounded-lg border px-3 py-2 text-sm"
    >
      {point ? (
        <>
          <span className="font-medium">{point.name}</span>
          <span className="text-muted">
            {' '}
            · Nota {point.grade} · probabilidad {formatPct(point.probability)}{' '}
            ·{' '}
          </span>
          <span
            className={point.closed ? 'text-brand-strong' : 'text-[#a32b2b]'}
          >
            {point.closed ? 'Cerró' : 'No cerró'}
          </span>
          <span className="text-subtle"> · clic para abrir su ficha</span>
        </>
      ) : (
        <span className="text-subtle">
          Pasa el mouse sobre un punto para ver el cliente.
        </span>
      )}
    </p>
  );
}
