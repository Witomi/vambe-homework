'use client';

import clsx from 'clsx';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import type { Insight } from '@/lib/api/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';

const TONE = {
  positive: {
    icon: TrendingUp,
    iconClass: 'text-positive bg-brand-soft',
    label: 'Cierra más que el promedio',
  },
  negative: {
    icon: TrendingDown,
    iconClass: 'text-negative bg-[#fdecec]',
    label: 'Cierra menos que el promedio',
  },
} as const;

/** Los segmentos que más suben y más bajan la tasa de cierre. */
export function InsightsPanel({ insights }: { insights: Insight[] }) {
  const { setParam } = useFilterParams();

  return (
    <Card
      title="Lo más importante"
      subtitle="Los grupos de clientes que más se alejan del promedio. Haz clic en uno para ver solo ese grupo."
    >
      {insights.length === 0 ? (
        <p className="text-muted text-sm">
          No hay suficientes reuniones en esta selección para sacar
          conclusiones.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {insights.map((insight) => (
            <li key={insight.id}>
              <InsightCard
                insight={insight}
                onSelect={() =>
                  insight.filter &&
                  setParam(insight.filter.key, insight.filter.value)
                }
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function InsightCard({
  insight,
  onSelect,
}: {
  insight: Insight;
  onSelect: () => void;
}) {
  const tone = TONE[insight.tone];
  const Icon = tone.icon;

  return (
    <button
      type="button"
      disabled={!insight.filter}
      onClick={onSelect}
      className="group border-border hover:border-brand/40 flex h-full w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
    >
      <span
        className={clsx(
          'grid size-8 shrink-0 place-items-center rounded-lg',
          tone.iconClass,
        )}
      >
        <Icon className="size-4" aria-label={tone.label} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{insight.title}</span>
        <span className="text-muted mt-0.5 block text-sm leading-relaxed">
          {insight.detail}
        </span>
      </span>
      <ArrowRight
        className="text-subtle group-hover:text-brand mt-1 size-3.5 shrink-0"
        aria-hidden
      />
    </button>
  );
}
