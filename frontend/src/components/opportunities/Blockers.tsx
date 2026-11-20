import type { Opportunities } from '@/lib/api/types';
import { formatNumber, formatPct, formatPointsDiff } from '@/lib/format';
import { OPPORTUNITIES_ORIGIN, segmentDetail } from '@/lib/opportunity-details';
import { Card } from '../ui/Card';
import { DetailButton } from './DetailDrawer';
import { WinningTraitsList } from './WinningTraitsList';

/**
 * Rasgos que bajan la tasa de cierre y, para cada uno, qué tenían los
 * clientes con ese rasgo que sí compraron.
 */
export function Blockers({
  blockers,
  baseRate,
}: {
  blockers: Opportunities['blockers'];
  baseRate: number;
}) {
  return (
    <Card
      title="¿Qué está frenando las ventas?"
      subtitle="Lo que piden o plantean los clientes que cierran menos que el promedio, ordenado por impacto (puntos perdidos × reuniones). Debajo de cada uno, con qué rasgos sí se cerró dentro de ese grupo."
    >
      {blockers.length === 0 ? (
        <p className="text-muted text-sm">
          No hay rasgos que bajen la conversión de forma clara.
        </p>
      ) : (
        <ol className="space-y-3">
          {blockers.map((b) => (
            <li
              key={`${b.dimension}-${b.value}`}
              className="border-border rounded-lg border p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <DetailButton
                  detail={segmentDetail(b, baseRate)}
                  className="hover:text-brand text-sm font-medium"
                >
                  <span className="text-subtle font-normal">
                    {b.dimensionLabel}:
                  </span>{' '}
                  {b.label}
                </DetailButton>
                <span className="text-xs tabular-nums">
                  cierra {formatPct(b.closeRate)}{' '}
                  <span className="text-negative-strong font-medium">
                    ({formatPointsDiff(b.closeRate, baseRate)})
                  </span>{' '}
                  <span className="text-subtle">
                    · {formatNumber(b.count)} reuniones
                  </span>
                </span>
              </div>
              <div className="mt-2">
                <WinningTraitsList segment={b} origin={OPPORTUNITIES_ORIGIN} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
