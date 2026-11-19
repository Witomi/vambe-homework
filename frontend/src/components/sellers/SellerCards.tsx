import clsx from 'clsx';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import type { SellerSummary } from '@/lib/api/types';
import { clientsHref } from '@/lib/filters/url';
import {
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from '@/lib/format';
import { BarTrack } from '../dashboard/BarTrack';
import { Badge } from '../ui/Badge';

export const SELLERS_ORIGIN = 'vendedores';

/**
 * Una tarjeta por vendedor, ordenadas de mejor a peor desempeño ajustado
 * por cartera: cuánto cierra frente a lo esperado según sus rubros, y en
 * qué rubro le va mejor y peor que al equipo.
 */
export function SellerCards({ sellers }: { sellers: SellerSummary[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sellers.map((s, i) => (
        <li key={s.seller}>
          <SellerCard seller={s} rank={i + 1} />
        </li>
      ))}
    </ul>
  );
}

function SellerCard({
  seller: s,
  rank,
}: {
  seller: SellerSummary;
  rank: number;
}) {
  const diff = pointsDiff(s.closeRate, s.expectedRate);

  return (
    <article className="border-border bg-surface flex h-full flex-col gap-4 rounded-xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-subtle text-xs">#{rank} en desempeño</p>
          <h2 className="text-lg font-semibold">{s.seller}</h2>
        </div>
        <Badge tone={diff >= 0 ? 'brand' : 'bad'}>
          {formatPointsDiff(s.closeRate, s.expectedRate)} vs. esperado
        </Badge>
      </header>

      <div className="space-y-2">
        <p className="text-sm">
          <span className="text-2xl font-semibold tabular-nums">
            {formatPct(s.closeRate)}
          </span>{' '}
          <span className="text-muted">
            de cierre en {formatNumber(s.count)} reuniones
          </span>
        </p>
        <div className="grid">
          <BarTrack
            width={s.closeRate}
            colorClass={diff >= 0 ? 'bg-positive' : 'bg-negative'}
            markerAt={s.expectedRate}
          />
        </div>
        <p className="text-subtle text-xs">
          Se esperaba {formatPct(s.expectedRate)} según los rubros de sus leads
          (línea punteada).
        </p>
      </div>

      <dl className="space-y-2 text-sm">
        <Highlight
          kind="strongest"
          highlight={s.strongest}
          empty="No supera al equipo en ningún rubro con muestra suficiente."
        />
        <Highlight
          kind="weakest"
          highlight={s.weakest}
          empty="No queda bajo el equipo en ningún rubro con muestra suficiente."
        />
      </dl>

      <Link
        href={clientsHref({ sellers: s.seller }, SELLERS_ORIGIN)}
        className="text-brand-strong mt-auto flex items-center gap-1 text-sm font-medium hover:underline"
      >
        Ver sus clientes
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </article>
  );
}

const HIGHLIGHT = {
  strongest: {
    label: 'Mejor rubro',
    icon: TrendingUp,
    iconClass: 'text-positive',
    diffClass: 'text-brand-strong',
  },
  weakest: {
    label: 'Rubro más flojo',
    icon: TrendingDown,
    iconClass: 'text-negative',
    diffClass: 'text-negative-strong',
  },
} as const;

function Highlight({
  kind,
  highlight: h,
  empty,
}: {
  kind: keyof typeof HIGHLIGHT;
  highlight: SellerSummary['strongest'];
  empty: string;
}) {
  const style = HIGHLIGHT[kind];
  const Icon = style.icon;

  return (
    <div className="flex items-start gap-2">
      <Icon
        className={clsx('mt-0.5 size-4 shrink-0', style.iconClass)}
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-subtle text-xs">{style.label}</dt>
        <dd>
          {h ? (
            <>
              <span className="font-medium">{h.industry.label}</span>{' '}
              <span className="text-muted text-xs tabular-nums">
                {formatPct(h.closeRate)} vs. {formatPct(h.teamRate)} del equipo{' '}
                <span className={clsx('font-medium', style.diffClass)}>
                  ({formatPointsDiff(h.closeRate, h.teamRate)})
                </span>{' '}
                · {h.count} reuniones
              </span>
            </>
          ) : (
            <span className="text-muted text-xs">{empty}</span>
          )}
        </dd>
      </div>
    </div>
  );
}
