import { Handshake, MessagesSquare, Target } from 'lucide-react';
import type { Metrics } from '@/lib/api/types';
import { formatCompact, formatNumber, formatPct } from '@/lib/format';

interface Kpi {
  label: string;
  value: string;
  detail: string;
  icon: typeof Handshake;
}

/** Las tres cifras clave del segmento. */
export function KpiCards({ kpis }: { kpis: Metrics['kpis'] }) {
  const items: Kpi[] = [
    {
      label: 'Reuniones',
      value: formatNumber(kpis.meetings),
      detail: `${formatNumber(kpis.closed)} terminaron en venta`,
      icon: Handshake,
    },
    {
      label: 'Tasa de cierre',
      value: formatPct(kpis.closeRate),
      detail: 'de las reuniones se cierran',
      icon: Target,
    },
    {
      label: 'Consultas automatizadas',
      value: formatCompact(kpis.automatedMonthlyInquiries),
      detail: 'por mes, en los clientes cerrados',
      icon: MessagesSquare,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(({ label, value, detail, icon: Icon }) => (
        <div
          key={label}
          className="border-border bg-surface rounded-xl border p-5"
        >
          <div className="text-muted flex items-center gap-1.5 text-sm">
            <Icon className="size-4" aria-hidden />
            {label}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
            {value}
          </div>
          <div className="text-subtle mt-1 text-sm">{detail}</div>
        </div>
      ))}
    </div>
  );
}
