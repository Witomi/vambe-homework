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
          {solutions.map((solution) => {
            const hidden = solution.industries.length - VISIBLE_INDUSTRIES;
            return (
              <li
                key={solution.useCases
                  .map((useCase) => useCase.value)
                  .join('+')}
                className="border-border rounded-lg border p-4"
              >
                <h3 className="text-sm font-semibold">
                  {solution.useCases
                    .map((useCase) => useCase.label)
                    .join(' + ')}
                  {solution.topIntegration && (
                    <span className="text-muted font-normal">
                      {' '}
                      · integrada con {solution.topIntegration.label}
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {solution.industries.length}{' '}
                  <span className="text-muted text-sm font-normal">
                    industrias
                  </span>
                </p>
                <p className="text-muted mt-1 text-xs tabular-nums">
                  {formatNumber(solution.clients)} clientes · cierra{' '}
                  {formatPct(solution.closeRate)} ·{' '}
                  {formatCompact(solution.monthlyInquiries)} consultas/mes
                </p>
                <p className="text-subtle mt-2 text-xs">
                  {solution.industries
                    .slice(0, VISIBLE_INDUSTRIES)
                    .map((integration) => integration.label)
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
