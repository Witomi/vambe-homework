import { ArrowRight } from 'lucide-react';
import type { Opportunities, OpportunityRules } from '@/lib/api/types';
import { formatPct, formatPointsDiff } from '@/lib/format';
import { assignmentDetail } from '@/lib/opportunity-details';
import { Card } from '../ui/Card';
import { DetailButton } from './DetailDrawer';

/** Regla de asignación: qué vendedor toma los leads de cada rubro. */
export function SellerAssignments({
  assignments,
  rules,
}: {
  assignments: Opportunities['assignments'];
  rules: OpportunityRules;
}) {
  return (
    <Card
      title="Top vendedores por industria"
      subtitle={`Para cada rubro, el vendedor que más cierra frente al resto del equipo (al menos ${rules.minAdvantagePts} puntos más y ${rules.minSellerMeetings} reuniones).`}
    >
      {assignments.length === 0 ? (
        <p className="text-muted text-sm">
          Ningún vendedor se destaca claramente en un rubro.
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {assignments.map((assignment) => (
            <li
              key={assignment.industry.value}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
            >
              <DetailButton
                detail={assignmentDetail(assignment)}
                className="hover:text-brand min-w-36 flex-1 font-medium"
              >
                Leads de {assignment.industry.label}
              </DetailButton>
              <ArrowRight className="text-subtle size-4" aria-hidden />
              <span className="w-20 font-semibold">{assignment.seller}</span>
              <span className="text-muted text-xs tabular-nums">
                cierra {formatPct(assignment.sellerRate)} vs.{' '}
                {formatPct(assignment.industryRate)} del equipo{' '}
                <span className="text-brand-strong font-medium">
                  (
                  {formatPointsDiff(
                    assignment.sellerRate,
                    assignment.industryRate,
                  )}
                  )
                </span>{' '}
                · {assignment.sellerMeetings} reuniones
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
