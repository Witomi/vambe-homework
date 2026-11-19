import Link from 'next/link';
import type { Prediction } from '@/lib/api/types';
import { formatNumber, formatPct } from '@/lib/format';
import { Card } from '../ui/Card';
import { GradeBadge } from '../ui/GradeBadge';

/**
 * Notas A–D: una forma simple de saber qué tan buen prospecto es cada
 * cliente. La columna "Cierran de verdad" valida que las notas funcionan.
 */
export function GradesTable({ grades }: { grades: Prediction['grades'] }) {
  return (
    <Card
      title="Notas de cliente"
      subtitle="Cada cliente recibe una nota según su probabilidad de cierre. La columna «Cierran de verdad» muestra que las notas funcionan: a mejor nota, más cierres."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="text-muted border-border border-b text-left text-xs">
            <tr>
              <th className="py-2 pr-3 font-medium">Nota</th>
              <th className="py-2 pr-3 font-medium">Probabilidad</th>
              <th className="py-2 pr-3 text-right font-medium">Clientes</th>
              <th className="py-2 pr-3 text-right font-medium">
                Cierran de verdad
              </th>
              <th className="py-2 font-medium">Qué hacer</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {grades.map((g) => (
              <tr key={g.grade}>
                <td className="py-3 pr-3">
                  <span className="flex items-center gap-2">
                    <GradeBadge grade={g.grade} />
                    <span className="font-medium">{g.title}</span>
                  </span>
                </td>
                <td className="text-muted py-3 pr-3 tabular-nums">{g.range}</td>
                <td className="py-3 pr-3 text-right tabular-nums">
                  <Link
                    href={`/clientes?grade=${g.grade}`}
                    className="hover:text-brand underline-offset-2 hover:underline"
                    title={`Ver los clientes con nota ${g.grade}`}
                  >
                    {formatNumber(g.count)}
                  </Link>
                </td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums">
                  {formatPct(g.closeRate)}
                </td>
                <td className="text-muted py-3 text-xs">{g.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
