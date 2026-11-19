import { Info } from 'lucide-react';
import Link from 'next/link';
import type { Opportunities } from '@/lib/api/types';
import {
  formatCompact,
  formatNumber,
  formatPct,
  formatPointsDiff,
} from '@/lib/format';
import { Card } from '../ui/Card';
import { GradeBadge } from '../ui/GradeBadge';

/** Leads perdidos que se parecen a los que sí cierran, para volver a contactar. */
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
      subtitle="Leads que no cerraron, pero que se parecen a los clientes que sí cierran. Empezando por los que reciben más consultas."
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
          : cuánto cierran, en promedio, los clientes con su mismo rubro, canal
          de adquisición, tamaño, dolor principal y urgencia. Es una estimación
          para priorizar, no una garantía.
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
                <td className="py-2.5 pr-3">{lead.seller}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums">
                  {formatNumber(lead.monthlyInquiries)}
                </td>
                <td
                  className="py-2.5 pr-3 text-right tabular-nums"
                  title={`Los clientes con un perfil como el de ${lead.name} cierran ${formatPct(lead.winScore)} de las veces; el promedio es ${formatPct(baseRate)}.`}
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
                <td className="text-muted py-2.5 text-xs">
                  {lead.reasons.join(' · ') || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
