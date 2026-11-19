'use client';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { BreakdownRow } from '@/lib/api/types';
import {
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from '@/lib/format';
import { wilsonInterval } from '@/lib/stats';
import { BarTrack } from './BarTrack';

export type BreakdownMetric = 'rate' | 'share';

interface BreakdownBarsProps {
  rows: BreakdownRow[];
  /** `rate`: tasa de cierre vs. promedio · `share`: % de clientes. */
  metric: BreakdownMetric;
  /** Tasa de cierre promedio: línea punteada y barra gris al final. */
  baseRate: number | null;
  /** Grupos con menos reuniones van a un bloque plegable al final. */
  minSample?: number;
  onSelect?: (value: string) => void;
  /** Valores seleccionados actualmente (resaltados). */
  selected?: string[];
  /** Valor que va siempre al final, separado y en gris (p. ej. "No lo menciona"). */
  trailingValue?: string;
  /** Etiqueta de la barra de promedio (aclara sobre qué base se calcula). */
  averageLabel?: string;
}

/**
 * Barras horizontales clicables para filtrar.
 *
 * - Todas las filas comparten las mismas columnas (CSS subgrid), así la
 *   línea del promedio queda alineada en todas.
 * - En modo `rate` el color indica si el grupo cierra sobre (azul) o bajo
 *   (rojo) el promedio, y al final va el promedio como barra gris.
 * - Los grupos con pocas reuniones no compiten en el ranking: van plegados
 *   al final, porque su tasa no es confiable (3 de 3 no es "100%").
 */
export function BreakdownBars({
  rows,
  metric,
  baseRate,
  minSample = 0,
  onSelect,
  selected = [],
  trailingValue,
  averageLabel = 'Promedio',
}: BreakdownBarsProps) {
  const [showSmall, setShowSmall] = useState(false);

  if (!rows.length) {
    return (
      <p className="text-muted py-6 text-center text-sm">
        Sin datos para esta selección.
      </p>
    );
  }

  const showAverage = metric === 'rate' && baseRate !== null;
  const maxShare = Math.max(...rows.map((r) => r.share), 0.0001);
  const byRelevance = (a: BreakdownRow, b: BreakdownRow) =>
    metric === 'rate'
      ? (b.closeRate ?? 0) - (a.closeRate ?? 0)
      : b.share - a.share;

  const regular = rows.filter((r) => r.value !== trailingValue);
  const reliable = regular
    .filter((r) => r.count >= minSample)
    .sort(byRelevance);
  const small = regular.filter((r) => r.count < minSample).sort(byRelevance);
  const trailing = rows.find((r) => r.value === trailingValue);

  const rowProps = (row: BreakdownRow) => ({
    row,
    metric,
    baseRate,
    width: metric === 'rate' ? (row.closeRate ?? 0) : row.share / maxShare,
    selected: selected.includes(row.value),
    onSelect,
  });

  return (
    <div>
      <ul className="grid grid-cols-[fit-content(9rem)_minmax(4rem,1fr)_auto] gap-y-1">
        {reliable.map((row) => (
          <BarRow key={row.value} {...rowProps(row)} />
        ))}
        {trailing && <BarRow {...rowProps(trailing)} variant="reference" />}
        {showAverage && <AverageRow baseRate={baseRate} label={averageLabel} />}
        {small.length > 0 && (
          <li className="col-span-full mt-1">
            <button
              type="button"
              aria-expanded={showSmall}
              onClick={() => setShowSmall((s) => !s)}
              className="text-muted hover:text-foreground flex items-center gap-1 px-1.5 py-1 text-xs"
            >
              <ChevronDown
                className={clsx(
                  'size-3.5 transition-transform',
                  showSmall && 'rotate-180',
                )}
                aria-hidden
              />
              {showSmall ? 'Ocultar' : 'Ver'} {small.length}{' '}
              {small.length === 1 ? 'grupo' : 'grupos'} con pocas reuniones
              (menos de {minSample})
            </button>
          </li>
        )}
        {showSmall &&
          small.map((row) => (
            <BarRow key={row.value} {...rowProps(row)} variant="small" />
          ))}
      </ul>
      {showAverage && <Legend />}
    </div>
  );
}

interface BarRowProps {
  row: BreakdownRow;
  metric: BreakdownMetric;
  baseRate: number | null;
  /** Largo de la barra, de 0 a 1. */
  width: number;
  selected: boolean;
  onSelect?: (value: string) => void;
  /** `reference`: fila gris separada · `small`: muestra chica, atenuada. */
  variant?: 'regular' | 'reference' | 'small';
}

function BarRow({
  row,
  metric,
  baseRate,
  width,
  selected,
  onSelect,
  variant = 'regular',
}: BarRowProps) {
  const rate = row.closeRate ?? 0;
  // El color sigue a la diferencia que se muestra, no a la exacta.
  const above = baseRate === null || pointsDiff(rate, baseRate) >= 0;
  const barColor =
    variant === 'reference'
      ? 'bg-subtle/60'
      : metric === 'share'
        ? 'bg-brand'
        : above
          ? 'bg-positive'
          : 'bg-negative';

  const range = wilsonInterval(row.closed, row.count);
  const tooltip =
    metric === 'rate'
      ? `${row.label}: ${formatPct(row.closeRate)} de ${formatNumber(row.count)} reuniones. ` +
        `Rango probable: ${formatPct(range.low)}–${formatPct(range.high)}.`
      : undefined;

  return (
    <li
      className={clsx(
        'col-span-full grid grid-cols-subgrid',
        variant === 'reference' && 'border-border mt-1 border-t pt-1',
      )}
    >
      <button
        type="button"
        disabled={!onSelect}
        onClick={() => onSelect?.(row.value)}
        title={tooltip}
        className={clsx(
          'col-span-full grid grid-cols-subgrid items-center gap-x-3 rounded-md py-1 text-left',
          onSelect && 'hover:bg-background',
          selected && 'bg-brand-soft',
          variant === 'small' && 'opacity-50',
        )}
      >
        <span className="truncate pl-1.5 text-xs">{row.label}</span>
        <BarTrack
          width={width}
          colorClass={barColor}
          markerAt={metric === 'rate' ? baseRate : null}
        />
        <span className="pr-1.5 text-right text-xs whitespace-nowrap tabular-nums">
          {metric === 'rate' ? (
            <>
              <span className="font-medium">{formatPct(row.closeRate)}</span>
              {baseRate !== null && (
                <span
                  className={clsx(
                    'ml-1',
                    above ? 'text-brand-strong' : 'text-[#a32b2b]',
                  )}
                >
                  {formatPointsDiff(rate, baseRate)}
                </span>
              )}
              <span className="text-subtle ml-1">
                ({formatNumber(row.count)})
              </span>
            </>
          ) : (
            <span className="font-medium">{formatPct(row.share)}</span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Barra gris con la tasa promedio, como referencia al final de la lista. */
function AverageRow({ baseRate, label }: { baseRate: number; label: string }) {
  return (
    <li className="border-border col-span-full mt-1 grid grid-cols-subgrid items-center gap-x-3 border-t pt-2">
      <span className="pl-1.5 text-xs font-medium">{label}</span>
      <BarTrack
        width={baseRate}
        colorClass="bg-subtle/60"
        markerAt={baseRate}
      />
      <span className="pr-1.5 text-right text-xs font-medium tabular-nums">
        {formatPct(baseRate)}
      </span>
    </li>
  );
}

function Legend() {
  return (
    <p className="text-subtle mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="flex items-center gap-1.5">
        <i className="bg-positive inline-block size-2 rounded-sm" aria-hidden />
        Sobre el promedio
      </span>
      <span className="flex items-center gap-1.5">
        <i className="bg-negative inline-block size-2 rounded-sm" aria-hidden />
        Bajo el promedio
      </span>
      <span>
        (n) = cantidad de reuniones · pasa el mouse para ver el rango probable
      </span>
    </p>
  );
}
