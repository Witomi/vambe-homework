import { ArrowRight } from 'lucide-react';
import type { Opportunities } from '@/lib/api/types';
import { formatPct, formatPointsDiff } from '@/lib/format';
import { assignmentDetail } from '@/lib/opportunity-details';
import { Card } from '../ui/Card';
import { DetailButton } from './DetailDrawer';

/** Regla de asignación: qué vendedor toma los leads de cada rubro. */
export function SellerAssignments({
  assignments,
}: {
  assignments: Opportunities['assignments'];
}) {
  return (
    <Card
      title="¿Quién toma cada lead?"
      subtitle="Para cada rubro, el vendedor que más cierra frente al resto del equipo (al menos 5 puntos más y 8 reuniones)."
    >
      {assignments.length === 0 ? (
        <p className="text-muted text-sm">
          Ningún vendedor se destaca claramente en un rubro.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {assignments.map((a) => (
            <li
              key={a.industry.value}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
            >
              <DetailButton
                detail={assignmentDetail(a)}
                className="hover:text-brand min-w-36 flex-1 font-medium"
              >
                Leads de {a.industry.label}
              </DetailButton>
              <ArrowRight className="text-subtle size-4" aria-hidden />
              <span className="w-20 font-semibold">{a.seller}</span>
              <span className="text-muted text-xs tabular-nums">
                cierra {formatPct(a.sellerRate)} vs. {formatPct(a.industryRate)}{' '}
                del equipo{' '}
                <span className="text-brand-strong font-medium">
                  ({formatPointsDiff(a.sellerRate, a.industryRate)})
                </span>{' '}
                · {a.sellerMeetings} reuniones
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
