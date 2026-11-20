import clsx from 'clsx';
import {
  Handshake,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { Metrics } from '@/lib/api/types';
import {
  formatChange,
  formatMonthYear,
  formatNumber,
  formatPct,
  formatPointsDiff,
  pointsDiff,
} from '@/lib/format';
import { HISTORIC_PERIOD } from '@/lib/periods';
import { AutomatedInquiriesChart } from './AutomatedInquiriesChart';
import { MonthlyCloseRateLine } from './MonthlyCloseRateLine';
import { MonthlyMeetingsBars } from './MonthlyMeetingsBars';
import { PeriodSelect } from './PeriodSelect';

type Kpis = Metrics['kpis'];
type Comparison = NonNullable<Metrics['monthComparison']>;
type MonthKpis = Comparison['current'];

/** Una fila "vs. feb 2025 · 407 · −34%" dentro de la tarjeta. */
interface CompareRow {
  label: string;
  /** null: no hubo reuniones ese mes en el segmento. */
  value: string | null;
  text: string | null;
  /** Signo del cambio: decide flecha y color. */
  direction: number;
}

interface Kpi {
  label: string;
  icon: typeof Handshake;
  value: string;
  detail: string;
  /** Gráfico pequeño bajo la cifra (opcional). */
  chart?: React.ReactNode;
  compare: CompareRow[];
  footer?: string;
}

/**
 * Las cifras clave. Con un mes elegido, reuniones y tasa de cierre se
 * comparan con el mes anterior y con el mismo mes del año pasado; en modo
 * histórico se muestran los totales del período. Al lado, el acumulado de
 * consultas automatizadas hasta el mes elegido.
 */
export function KpiCards({
  kpis,
  timeline,
  comparison,
  months,
}: {
  kpis: Kpis;
  timeline: Metrics['timeline'];
  /** null: modo histórico (o segmento sin reuniones). */
  comparison: Metrics['monthComparison'];
  /** Meses que se pueden elegir, del más reciente al más antiguo. */
  months: string[];
}) {
  const selectedMonth = comparison?.current.month ?? null;
  const meetingsChart = (
    <MonthlyMeetingsBars timeline={timeline} month={selectedMonth} />
  );
  const closeRateChart = (
    <MonthlyCloseRateLine
      timeline={timeline}
      month={selectedMonth}
      average={kpis.closeRate}
    />
  );
  const items: Kpi[] = comparison
    ? [
        { ...meetingsOfMonth(kpis, comparison), chart: meetingsChart },
        { ...closeRateOfMonth(kpis, comparison), chart: closeRateChart },
      ]
    : [
        {
          label: 'Reuniones',
          icon: Handshake,
          value: formatNumber(kpis.meetings),
          detail: `${formatNumber(kpis.closed)} terminaron en venta`,
          chart: meetingsChart,
          compare: [],
        },
        {
          label: 'Tasa de cierre',
          icon: Target,
          value: formatPct(kpis.closeRate),
          detail: 'de las reuniones se cierran',
          chart: closeRateChart,
          compare: [],
        },
      ];

  return (
    <section className="space-y-3" aria-label="Cifras clave">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Cifras clave ·{' '}
          <span className="text-muted font-normal">
            {comparison
              ? formatMonthYear(comparison.current.month)
              : 'todo el período'}
          </span>
        </h2>
        <PeriodSelect
          months={months}
          value={comparison?.current.month ?? HISTORIC_PERIOD}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
        <AutomatedInquiriesChart
          kpis={kpis}
          timeline={timeline}
          month={selectedMonth}
        />
      </div>
    </section>
  );
}

/** Filas de comparación: mes anterior y mismo mes del año pasado. */
function compareRows(
  comparison: Comparison,
  format: (m: MonthKpis) => string,
  change: (m: MonthKpis) => { text: string | null; direction: number },
): CompareRow[] {
  return [comparison.previousMonth, comparison.sameMonthLastYear].map((m) => ({
    label: `vs. ${formatMonthYear(m.month)}`,
    value: m.meetings ? format(m) : null,
    ...(m.meetings ? change(m) : { text: null, direction: 0 }),
  }));
}

function meetingsOfMonth(kpis: Kpis, comparison: Comparison): Kpi {
  const { current } = comparison;
  return {
    label: 'Reuniones del mes',
    icon: Handshake,
    value: formatNumber(current.meetings),
    detail: `${formatNumber(current.closed)} terminaron en venta`,
    compare: compareRows(
      comparison,
      (m) => formatNumber(m.meetings),
      (m) => ({
        text: formatChange(current.meetings, m.meetings),
        direction: Math.sign(current.meetings - m.meetings),
      }),
    ),
    footer: `${formatNumber(kpis.meetings)} en todo el período`,
  };
}

function closeRateOfMonth(kpis: Kpis, comparison: Comparison): Kpi {
  const rate = comparison.current.closeRate;
  return {
    label: 'Tasa de cierre del mes',
    icon: Target,
    value: formatPct(rate),
    detail: 'de las reuniones del mes se cierran',
    compare: compareRows(
      comparison,
      (m) => formatPct(m.closeRate),
      (m) =>
        rate === null || m.closeRate === null
          ? { text: null, direction: 0 }
          : {
              text: formatPointsDiff(rate, m.closeRate),
              direction: Math.sign(pointsDiff(rate, m.closeRate)),
            },
    ),
    footer: `${formatPct(kpis.closeRate)} en todo el período`,
  };
}

const DIRECTION = {
  up: { icon: TrendingUp, className: 'text-brand-strong' },
  down: { icon: TrendingDown, className: 'text-negative-strong' },
  flat: { icon: Minus, className: 'text-subtle' },
} as const;

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="border-border bg-surface flex flex-col rounded-xl border p-5">
      <div className="text-muted flex items-center gap-1.5 text-sm">
        <Icon className="size-4" aria-hidden />
        {kpi.label}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
        {kpi.value}
      </div>
      <div className="text-subtle mt-1 text-sm">{kpi.detail}</div>
      {kpi.chart}

      {kpi.compare.length > 0 && (
        <dl className="border-border mt-4 space-y-1.5 border-t pt-3 text-sm">
          {kpi.compare.map((row) => {
            const dir =
              DIRECTION[
                row.direction > 0 ? 'up' : row.direction < 0 ? 'down' : 'flat'
              ];
            const DirIcon = dir.icon;
            return (
              <div key={row.label} className="flex items-center gap-2">
                <dt className="text-muted flex-1">{row.label}</dt>
                <dd className="tabular-nums">
                  {row.value ?? (
                    <span className="text-subtle">sin reuniones</span>
                  )}
                </dd>
                {row.text && (
                  <dd
                    className={clsx(
                      'flex w-20 items-center justify-end gap-1 font-medium tabular-nums',
                      dir.className,
                    )}
                  >
                    <DirIcon className="size-3.5" aria-hidden />
                    {row.text}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      )}

      {kpi.footer && (
        <p className="text-subtle mt-auto pt-3 text-xs">{kpi.footer}</p>
      )}
    </div>
  );
}
