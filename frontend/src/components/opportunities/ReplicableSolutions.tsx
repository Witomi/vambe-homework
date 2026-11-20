import type { Opportunities, OpportunityRules } from '@/lib/api/types';
import { formatCompact, formatNumber, formatPct } from '@/lib/format';
import { Card } from '../ui/Card';

const VISIBLE_INDUSTRIES = 5;

/** Combinaciones de necesidades que se repiten en muchos rubros. */
export function ReplicableSolutions({
  solutions,
  rules,
}: {
  solutions: Opportunities['solutions'];
  rules: OpportunityRules;
}) {
  return (
    <Card
      title="¿Qué solución construir una vez y vender en muchos rubros?"
      subtitle={`Combinaciones de funciones que piden clientes de ${rules.minSolutionIndustries} o más industrias distintas.`}
    >
      {solutions.length === 0 ? (
        <p className="text-muted text-sm">
          No hay combinaciones que se repitan en suficientes rubros.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {solutions.map((s) => {
            const hidden = s.industries.length - VISIBLE_INDUSTRIES;
            return (
              <li
                key={s.useCases.map((u) => u.value).join('+')}
                className="border-border rounded-lg border p-4"
              >
                <h3 className="text-sm font-semibold">
                  {s.useCases.map((u) => u.label).join(' + ')}
                  {s.topIntegration && (
                    <span className="text-muted font-normal">
                      {' '}
                      · integrada con {s.topIntegration.label}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {s.industries.length}{' '}
                  <span className="text-muted text-sm font-normal">
                    industrias
                  </span>
                </p>
                <p className="text-muted mt-1 text-xs tabular-nums">
                  {formatNumber(s.clients)} clientes · cierra{' '}
                  {formatPct(s.closeRate)} · {formatCompact(s.monthlyInquiries)}{' '}
                  consultas/mes
                </p>
                <p className="text-subtle mt-2 text-xs">
                  {s.industries
                    .slice(0, VISIBLE_INDUSTRIES)
                    .map((i) => i.label)
                    .join(', ')}
                  {hidden > 0 && ` y ${hidden} más`}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
