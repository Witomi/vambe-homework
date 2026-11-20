'use client';

import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metrics } from '@/lib/api/types';
import { listParam } from '@/lib/filters/params';
import {
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from '@/lib/format';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';
import { BarTrack } from './BarTrack';
import { OutcomeFilterNotice, useOutcomeFiltered } from './OutcomeFilterNotice';

/**
 * Desempeño por vendedor ajustado por cartera: la barra es lo que cerró y
 * la línea punteada lo que se esperaba según los rubros de sus leads.
 * Se ordena por la diferencia, que mide habilidad y no suerte.
 */
export function SellerPerformance({ metrics }: { metrics: Metrics }) {
  const { searchParams, toggleParamValue } = useFilterParams();
  const selected = listParam(searchParams, 'sellers');
  const outcomeFiltered = useOutcomeFiltered();

  return (
    <Card
      title="¿Cómo le va a cada vendedor?"
      subtitle="Lo que cerró cada uno frente a lo esperado según los rubros de sus leads. Así se mide su desempeño y no la suerte en la asignación."
      action={
        <Link
          href="/vendedores"
          className="border-border text-brand-strong hover:bg-brand-soft flex h-8 items-center gap-1 rounded-lg border px-2.5 text-sm font-medium whitespace-nowrap transition-colors"
        >
          Ver detalle
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {outcomeFiltered ? (
        <OutcomeFilterNotice what="el desempeño de cada vendedor" />
      ) : metrics.sellers.length === 0 ? (
        <p className="text-muted text-sm">Sin reuniones analizadas.</p>
      ) : (
        <ul className="grid grid-cols-[fit-content(7rem)_minmax(4rem,1fr)_auto] gap-y-1">
          {metrics.sellers.map((performance) => {
            const diff = pointsDiff(
              performance.closeRate,
              performance.expectedRate,
            );
            return (
              <li
                key={performance.seller}
                className="col-span-full grid grid-cols-subgrid"
              >
                <button
                  type="button"
                  onClick={() =>
                    toggleParamValue('sellers', performance.seller)
                  }
                  title={`${performance.seller}: cerró ${formatPct(performance.closeRate)} de ${formatNumber(performance.count)} reuniones; se esperaba ${formatPct(performance.expectedRate)} según sus rubros.`}
                  className={clsx(
                    'hover:bg-background col-span-full grid grid-cols-subgrid items-center gap-x-3 rounded-md py-1 text-left',
                    selected.includes(performance.seller) && 'bg-brand-soft',
                  )}
                >
                  <span className="pl-1.5 text-xs">{performance.seller}</span>
                  <BarTrack
                    width={performance.closeRate}
                    colorClass={diff >= 0 ? 'bg-positive' : 'bg-negative'}
                    markerAt={performance.expectedRate}
                  />
                  <span className="pr-1.5 text-right text-xs whitespace-nowrap tabular-nums">
                    <span className="font-medium">
                      {formatPct(performance.closeRate)}
                    </span>
                    <span
                      className={clsx(
                        'ml-1',
                        diff >= 0
                          ? 'text-brand-strong'
                          : 'text-negative-strong',
                      )}
                    >
                      {formatPointsDiff(
                        performance.closeRate,
                        performance.expectedRate,
                      )}
                    </span>
                    <span className="text-subtle ml-1">
                      (esp. {formatPct(performance.expectedRate)})
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!outcomeFiltered && (
        <p className="text-subtle mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1.5">
            <i
              className="border-foreground/50 inline-block h-3 border-l border-dashed"
              aria-hidden
            />
            Esperado según su cartera
          </span>
          <span className="flex items-center gap-1.5">
            <i
              className="bg-positive inline-block size-2 rounded-sm"
              aria-hidden
            />
            Sobre lo esperado
          </span>
          <span className="flex items-center gap-1.5">
            <i
              className="bg-negative inline-block size-2 rounded-sm"
              aria-hidden
            />
            Bajo lo esperado
          </span>
        </p>
      )}
    </Card>
  );
}
