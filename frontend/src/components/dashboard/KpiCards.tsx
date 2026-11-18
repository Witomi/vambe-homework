import { Bot, Handshake, MessagesSquare, Target } from 'lucide-react';
import { formatCompact, formatNumber, formatPct } from '@/lib/format';
import type { Metrics } from '@/lib/api/types';

interface Kpi {
  label: string;
  value: string;
  detail: string;
  icon: typeof Bot;
}

export function KpiCards({ kpis }: { kpis: Metrics['kpis'] }) {
  const items: Kpi[] = [
    {
      label: 'Reuniones',
      value: formatNumber(kpis.meetings),
      detail: `${formatNumber(kpis.closed)} ventas cerradas`,
      icon: Handshake,
    },
    {
      label: 'Tasa de cierre',
      value: formatPct(kpis.closeRate, 1),
      detail: 'del segmento filtrado',
      icon: Target,
    },
    {
      label: 'Consultas automatizadas',
      value: formatCompact(kpis.automatedMonthlyInquiries),
      detail: 'por mes, en clientes cerrados categorizados',
      icon: MessagesSquare,
    },
    {
      label: 'Cobertura IA',
      value: formatPct(kpis.coverage),
      detail: `${formatNumber(kpis.categorized)} reuniones categorizadas · mediana ${formatNumber(kpis.medianMonthlyInquiries)} consultas/mes`,
      icon: Bot,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, detail, icon: Icon }) => (
        <div
          key={label}
          className="border-border bg-surface rounded-xl border p-4"
        >
          <div className="text-muted flex items-center gap-1.5 text-xs font-medium">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </div>
          <div className="text-subtle mt-1 text-xs">{detail}</div>
        </div>
      ))}
    </div>
  );
}
