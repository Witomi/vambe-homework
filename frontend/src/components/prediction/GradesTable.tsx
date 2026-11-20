import Link from 'next/link';
import type { Prediction } from '@/lib/api/types';
import { formatCompact, formatNumber, formatPct } from '@/lib/format';
import { Card } from '../ui/Card';
import { GradeBadge } from '../ui/GradeBadge';

/**
 * Notas A–F: una forma simple de saber qué tan buen prospecto es cada
 * cliente. La columna "Tasa de cierre real" compara la nota con lo que pasó.
 */
export function GradesTable({ grades }: { grades: Prediction['grades'] }) {
  return (
    <Card
      title="Notas de cliente"
      subtitle="Cada cliente recibe una nota según su probabilidad de cierre. La columna «Tasa de cierre real» muestra qué porcentaje de los clientes de cada nota compró de verdad."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-muted border-border border-b text-left text-xs">
            <tr>
              <th className="py-2 pr-3 font-medium">Nota</th>
              <th className="py-2 pr-3 font-medium">Probabilidad</th>
              <th className="py-2 pr-3 text-right font-medium">Clientes</th>
              <th className="py-2 pr-3 text-right font-medium">
                % de clientes
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                Tasa de cierre real
              </th>
              <th className="py-2 text-right font-medium">Sin cerrar</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {grades.map((grade) => (
              <tr key={grade.grade}>
                <td className="py-3 pr-3">
                  <span className="flex items-center gap-2">
                    <GradeBadge grade={grade.grade} />
                    <span className="font-medium">{grade.title}</span>
                  </span>
                </td>
                <td className="text-muted py-3 pr-3 tabular-nums">
                  {grade.range}
                </td>
                <td className="py-3 pr-3 text-right tabular-nums">
                  <Link
                    href={`/clientes?grade=${grade.grade}`}
                    className="hover:text-brand underline-offset-2 hover:underline"
                    title={`Ver los clientes con nota ${grade.grade}`}
                  >
                    {formatNumber(grade.count)}
                  </Link>
                </td>
                <td className="text-muted py-3 pr-3 text-right tabular-nums">
                  {formatPct(grade.share)}
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {formatPct(grade.closeRate)}
                </td>
                <td className="py-3 text-right tabular-nums">
                  <Link
                    href={`/clientes?grade=${grade.grade}&closed=false`}
                    className="hover:text-brand underline-offset-2 hover:underline"
                    title={`Ver los ${formatNumber(grade.openLeads)} clientes con nota ${grade.grade} que no cerraron`}
                  >
                    {formatNumber(grade.openLeads)} leads
                  </Link>
                  <span className="text-subtle block text-xs">
                    {formatCompact(grade.openInquiries)} consultas/mes
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
