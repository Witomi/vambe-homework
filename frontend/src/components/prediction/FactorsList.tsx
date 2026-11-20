import { TrendingDown, TrendingUp } from 'lucide-react';
import type { Factor, Prediction } from '@/lib/api/types';
import { formatOdds } from '@/lib/format';
import { Card } from '../ui/Card';

/** Qué rasgos de la reunión mueven más la probabilidad de cierre. */
export function FactorsList({ factors }: { factors: Prediction['factors'] }) {
  return (
    <Card
      title="¿Qué mueve la probabilidad?"
      subtitle="Cuánto multiplica las chances de cierre cada rasgo, manteniendo todo lo demás igual. ×1,50 = 50% más chances; ×0,50 = la mitad."
    >
      <div className="grid gap-6 md:grid-cols-2">
        <FactorColumn
          title="La suben"
          icon={<TrendingUp className="text-positive size-4" aria-hidden />}
          factors={factors.positive}
          tone="text-brand-strong"
        />
        <FactorColumn
          title="La bajan"
          icon={<TrendingDown className="text-negative size-4" aria-hidden />}
          factors={factors.negative}
          tone="text-negative-strong"
        />
      </div>
    </Card>
  );
}

function FactorColumn({
  title,
  icon,
  factors,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  factors: Factor[];
  tone: string;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      <ul className="divide-border divide-y">
        {factors.map((factor) => (
          <li
            key={factor.label}
            className="flex items-baseline justify-between gap-3 py-2 text-sm"
          >
            <span>{factor.label}</span>
            <span className={`font-medium tabular-nums ${tone}`}>
              {formatOdds(factor.oddsRatio)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
