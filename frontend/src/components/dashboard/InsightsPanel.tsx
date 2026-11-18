'use client';

import clsx from 'clsx';
import {
  ArrowRight,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import type { Insight } from '@/lib/api/types';
import { useFilterParams } from '../filters/useFilterParams';
import { Card } from '../ui/Card';

const TONE = {
  positive: {
    icon: TrendingUp,
    className: 'text-positive bg-brand-soft',
    label: 'Sobre el promedio',
  },
  negative: {
    icon: TrendingDown,
    className: 'text-negative bg-[#fdecec]',
    label: 'Bajo el promedio',
  },
  neutral: {
    icon: UserCheck,
    className: 'text-muted bg-background',
    label: 'Oportunidad',
  },
} as const;

/** Hallazgos automáticos; cada uno lleva al segmento que lo explica. */
export function InsightsPanel({ insights }: { insights: Insight[] }) {
  const { setParam } = useFilterParams();

  return (
    <Card
      title="Hallazgos clave"
      subtitle="Segmentos cuya tasa de cierre se desvía del promedio (muestras ≥ 3% del total). Haz clic para filtrar."
    >
      {insights.length === 0 ? (
        <p className="text-muted flex items-center gap-2 text-sm">
          <Lightbulb className="size-4" aria-hidden />
          No hay suficientes reuniones categorizadas en este segmento para
          generar hallazgos confiables.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => {
            const tone = TONE[insight.tone];
            const Icon = tone.icon;
            return (
              <li key={insight.id}>
                <button
                  type="button"
                  disabled={!insight.filter}
                  onClick={() =>
                    insight.filter &&
                    setParam(insight.filter.key, insight.filter.value)
                  }
                  className="group border-border hover:border-brand/40 flex h-full w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
                >
                  <span
                    className={clsx(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      tone.className,
                    )}
                  >
                    <Icon className="size-4" aria-label={tone.label} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {insight.title}
                    </span>
                    <span className="text-muted mt-0.5 block text-xs leading-relaxed">
                      {insight.detail}
                    </span>
                  </span>
                  <ArrowRight
                    className="text-subtle group-hover:text-brand mt-1 size-3.5 shrink-0"
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
