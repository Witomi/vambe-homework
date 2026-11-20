import clsx from 'clsx';
import type {
  Opportunities,
  OpportunityRules,
  Quadrant,
} from '@/lib/api/types';
import { formatNumber, formatPct, formatPointsDiff } from '@/lib/format';
import { segmentDetail } from '@/lib/opportunity-details';
import { Card } from '../ui/Card';
import { DetailButton } from './DetailDrawer';

/** Estilo de cada cuadrante: color de borde + etiqueta (nunca solo color). */
const STYLE: Record<Quadrant['key'], string> = {
  protect: 'border-l-positive',
  grow: 'border-l-good',
  fix: 'border-l-negative',
  deprioritize: 'border-l-subtle',
};

/**
 * Mapa volumen × conversión: cada grupo de clientes cae en uno de cuatro
 * cuadrantes según una regla sobre los datos. Al abrir un grupo se ven sus
 * palancas: qué tenían los que sí cerraron.
 */
export function SegmentMap({
  quadrants,
  baseRate,
  rules,
}: {
  quadrants: Opportunities['quadrants'];
  baseRate: number;
  rules: OpportunityRules;
}) {
  return (
    <Card
      title="¿Dónde poner el esfuerzo?"
      subtitle={`Cada rubro, canal y tamaño de empresa según cuántos clientes trae y si cierra sobre o bajo el promedio (${formatPct(baseRate)}). Se omiten los que están a menos de ${rules.neutralBandPts} puntos del promedio. Haz clic en uno para ver el detalle.`}
    >
      <div className="grid gap-3 md:grid-cols-2">
        {quadrants.map((quadrant) => (
          <QuadrantCard
            key={quadrant.key}
            quadrant={quadrant}
            baseRate={baseRate}
          />
        ))}
      </div>
    </Card>
  );
}

function QuadrantCard({
  quadrant,
  baseRate,
}: {
  quadrant: Quadrant;
  baseRate: number;
}) {
  return (
    <section
      className={clsx(
        'border-border rounded-lg border border-l-4 p-4',
        STYLE[quadrant.key],
      )}
    >
      <h3 className="text-sm font-semibold">{quadrant.title}</h3>
      <p className="text-muted mt-1 text-sm">{quadrant.description}</p>
      {quadrant.segments.length === 0 ? (
        <p className="text-subtle mt-3 text-xs">
          Ningún grupo en este cuadrante.
        </p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {quadrant.segments.map((segment) => (
            <li key={`${segment.dimension}-${segment.value}`}>
              <DetailButton
                detail={segmentDetail(segment, baseRate)}
                className="border-border bg-surface hover:border-brand/50 inline-flex items-center gap-1.5 rounded-full border py-1 pr-1.5 pl-2 text-xs"
              >
                <span className="text-subtle">{segment.dimensionLabel}:</span>
                <span className="font-medium">{segment.label}</span>
                <span className="tabular-nums">
                  {formatPct(segment.closeRate)}{' '}
                  <span className="text-subtle">
                    ({formatPointsDiff(segment.closeRate, baseRate)},{' '}
                    {formatNumber(segment.count)})
                  </span>
                </span>
              </DetailButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
