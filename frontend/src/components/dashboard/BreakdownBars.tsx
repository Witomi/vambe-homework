'use client';

import clsx from 'clsx';
import { formatNumber, formatPct, formatPp } from '@/lib/format';
import type { BreakdownRow } from '@/lib/types';

export type BreakdownMetric = 'rate' | 'share';

interface BreakdownBarsProps {
  rows: BreakdownRow[];
  metric: BreakdownMetric;
  /** Tasa de cierre de referencia (línea vertical en modo "rate"). */
  baseRate: number | null;
  /** Filas con menos casos se atenúan: su tasa no es confiable. */
  minSample?: number;
  onSelect?: (value: string) => void;
  /** Valor seleccionado actualmente (resaltado). */
  selected?: string[];
}

/**
 * Barras horizontales en HTML: legibles, accesibles por teclado y clicables
 * para filtrar. En modo "rate" el color indica si el segmento cierra sobre
 * (azul) o bajo (rojo) el promedio; el texto siempre acompaña al color.
 */
export function BreakdownBars({
  rows,
  metric,
  baseRate,
  minSample = 0,
  onSelect,
  selected = [],
}: BreakdownBarsProps) {
  if (!rows.length) {
    return (
      <p className="text-muted py-6 text-center text-sm">
        Sin datos para este segmento.
      </p>
    );
  }
  const maxShare = Math.max(...rows.map((r) => r.share), 0.0001);
  const sorted =
    metric === 'rate'
      ? [...rows].sort((a, b) => (b.closeRate ?? 0) - (a.closeRate ?? 0))
      : [...rows].sort((a, b) => b.share - a.share);

  return (
    <div className="relative">
      <ul className="space-y-1">
        {sorted.map((row) => {
          const small = row.count < minSample;
          const rate = row.closeRate ?? 0;
          const width = metric === 'rate' ? rate : row.share / maxShare;
          const above = baseRate === null || rate >= baseRate;
          const lift = baseRate === null ? null : rate - baseRate;
          const isSelected = selected.includes(row.value);

          return (
            <li key={row.value}>
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(row.value)}
                title={
                  small ? 'Muestra pequeña: interpretar con cautela' : undefined
                }
                className={clsx(
                  'group grid w-full grid-cols-[minmax(4.5rem,11rem)_minmax(3rem,1fr)_auto] items-center gap-3 rounded-md px-1.5 py-1 text-left',
                  onSelect && 'hover:bg-background',
                  isSelected && 'bg-brand-soft',
                  small && 'opacity-50',
                )}
              >
                <span className="truncate text-xs" title={row.label}>
                  {row.label}
                </span>
                <span className="relative h-5">
                  <span
                    className={clsx(
                      'absolute inset-y-0.5 left-0 rounded-r-[4px]',
                      metric === 'share'
                        ? 'bg-brand'
                        : above
                          ? 'bg-positive'
                          : 'bg-negative',
                    )}
                    style={{ width: `${Math.max(width * 100, 1)}%` }}
                  />
                  {metric === 'rate' && baseRate !== null && (
                    <span
                      className="border-foreground/50 absolute -inset-y-0.5 border-l border-dashed"
                      style={{ left: `${baseRate * 100}%` }}
                      aria-hidden
                    />
                  )}
                </span>
                <span className="text-right text-xs whitespace-nowrap tabular-nums">
                  {metric === 'rate' ? (
                    <>
                      <span className="font-medium">
                        {formatPct(row.closeRate)}
                      </span>
                      {lift !== null && (
                        <span
                          className={clsx(
                            'ml-1',
                            above ? 'text-brand-strong' : 'text-[#a32b2b]',
                          )}
                        >
                          {formatPp(lift)}
                        </span>
                      )}
                      <span className="text-subtle ml-1">
                        n={formatNumber(row.count)}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">
                        {formatPct(row.share)}
                      </span>
                      <span className="text-subtle ml-1">
                        · cierra {formatPct(row.closeRate)}
                      </span>
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {metric === 'rate' && baseRate !== null && (
        <p className="text-subtle mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span
            className="border-foreground/50 inline-block h-3 border-l border-dashed"
            aria-hidden
          />
          Promedio del segmento: {formatPct(baseRate, 1)}
          <span
            className="bg-positive ml-2 inline-block size-2 rounded-sm"
            aria-hidden
          />{' '}
          sobre
          <span
            className="bg-negative ml-1 inline-block size-2 rounded-sm"
            aria-hidden
          />{' '}
          bajo el promedio
        </p>
      )}
    </div>
  );
}
