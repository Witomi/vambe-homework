import { ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import type { Opportunities } from '@/lib/api/types';
import {
  formatCompact,
  formatNumber,
  formatOdds,
  formatPct,
  formatPointsDiff,
} from '@/lib/format';
import { Card } from '../ui/Card';
import { GradeBadge } from '../ui/GradeBadge';

/** Leads perdidos con probabilidad estimada sobre el promedio, para volver a contactar. */
export function LeadRecovery({
  recovery,
  baseRate,
}: {
  recovery: Opportunities['recovery'];
  baseRate: number;
}) {
  return (
    <Card
      title="¿A quién volver a llamar?"
      subtitle="Leads que no cerraron y a los que el modelo les estima una probabilidad de cierre sobre el promedio. Ordenados de mayor a menor probabilidad."
    >
      <p className="bg-brand-soft text-brand-strong rounded-lg px-4 py-3 text-sm">
        <strong>{formatNumber(recovery.candidates)} leads perdidos</strong>{' '}
        tienen una probabilidad de cierre sobre el promedio (
        {formatPct(baseRate)}). Juntos reciben{' '}
        <strong>
          {formatCompact(recovery.monthlyInquiries)} consultas al mes
        </strong>
        .
      </p>
      <p className="text-muted mt-2 mb-4 flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="text-foreground font-medium">
            Prob. de cierre
          </strong>
          : la estima el modelo de la pestaña Predicción a partir de todo lo que
          contó en la reunión. Es una estimación para priorizar, no una
          garantía.{' '}
          <strong className="text-foreground font-medium">Vendedor</strong>: el
          que lo atendió; si con otro vendedor el modelo estima más probabilidad
          para ese lead, se sugiere que lo retome él.
        </span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="text-muted border-border border-b text-left text-xs">
            <tr>
              <th className="py-2 pr-3 font-medium">Cliente</th>
              <th className="py-2 pr-3 font-medium">Vendedor</th>
              <th className="py-2 pr-3 text-right font-medium">
                Consultas/mes
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                Prob. de cierre
              </th>
              <th className="py-2 font-medium">Qué la sube</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {recovery.top.map((lead) => (
              <tr key={lead.id}>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/clientes?cliente=${lead.id}`}
                    className="hover:text-brand font-medium"
                  >
                    {lead.name}
                  </Link>
                  <div className="text-subtle text-xs">{lead.industry}</div>
                </td>
                <td className="py-2.5 pr-3">
                  {lead.suggestedSeller ? (
                    <span
                      className="flex items-center gap-1"
                      title={`Lo atendió ${lead.seller}. Con ${lead.suggestedSeller.seller}, el modelo estima ${lead.suggestedSeller.gainPts} puntos más de probabilidad.`}
                    >
                      <span className="text-muted line-through decoration-1">
                        {lead.seller}
                      </span>
                      <ArrowRight
                        className="text-subtle size-3.5"
                        aria-label="reasignar a"
                      />
                      <span className="text-brand-strong font-medium">
                        {lead.suggestedSeller.seller}
                      </span>
                      <span className="text-brand-strong text-xs tabular-nums">
                        +{lead.suggestedSeller.gainPts} pts
                      </span>
                    </span>
                  ) : (
                    lead.seller
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatNumber(lead.monthlyInquiries)}
                </td>
                <td
                  className="py-2.5 pr-3 text-right tabular-nums"
                  title={`Probabilidad estimada por el modelo para ${lead.name}: ${formatPct(lead.winScore)}; el promedio es ${formatPct(baseRate)}.`}
                >
                  <div className="flex items-center justify-end gap-2 font-medium">
                    <GradeBadge grade={lead.grade} />
                    {formatPct(lead.winScore)}
                  </div>
                  <div className="text-brand-strong text-xs">
                    {formatPointsDiff(lead.winScore, baseRate)} vs.{' '}
                    {formatPct(baseRate)}
                  </div>
                </td>
                <td className="py-2.5">
                  {lead.reasons.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {lead.reasons.map((reason) => (
                        <li key={reason.label}>
                          <ReasonChip reason={reason} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-subtle text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type Reason = Opportunities['recovery']['top'][number]['reasons'][number];

/**
 * Un rasgo como etiqueta: la dimensión en gris, el valor y cuánto multiplica
 * las chances de cierre ("Industria · E-commerce ×1,2").
 */
function ReasonChip({ reason }: { reason: Reason }) {
  const [dimension, value] = reason.label.includes(': ')
    ? reason.label.split(': ', 2)
    : [null, reason.label];
  return (
    <span
      title={`${reason.label}: multiplica las chances de cierre por ${formatOdds(reason.oddsRatio, 1).slice(1)}.`}
      className="border-border bg-background inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs whitespace-nowrap"
    >
      {dimension && <span className="text-subtle">{dimension}</span>}
      <span className="text-foreground">{value}</span>
      <span className="text-brand-strong font-medium tabular-nums">
        {formatOdds(reason.oddsRatio, 1)}
      </span>
    </span>
  );
}
