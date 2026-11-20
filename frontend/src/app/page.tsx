import { CustomerNeeds } from '@/components/dashboard/CustomerNeeds';
import { DimensionExplorer } from '@/components/dashboard/DimensionExplorer';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { SellerPerformance } from '@/components/dashboard/SellerPerformance';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { ActiveFiltersBanner } from '@/components/filters/ActiveFiltersBanner';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/format';
import { SearchParams, filterQuery } from '@/lib/filters/params';
import { monthsBetween } from '@/lib/periods';

/**
 * General: el panel comercial. Se lee de arriba hacia abajo:
 * 1. Cifras clave y hallazgos (la respuesta rápida).
 * 2. Qué clientes cierran más y qué piden (el detalle).
 * 3. Evolución mensual y vendedores (el contexto).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = filterQuery(params);
  // El período solo afecta las cifras clave; no es un filtro del segmento.
  if (typeof params.period === 'string') query.set('period', params.period);
  const [meta, metrics] = await Promise.all([api.meta(), api.metrics(query)]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="General"
        description="Qué clientes llegan, qué necesitan y cuáles terminan comprando."
        aside={<CoverageNote meta={meta} />}
      />
      <DashboardFilters meta={meta} />
      <ActiveFiltersBanner
        meta={meta}
        summary={`${formatNumber(metrics.kpis.meetings)} de ${formatNumber(meta.categorization.total)} reuniones`}
      />
      <KpiCards
        kpis={metrics.kpis}
        timeline={metrics.timeline}
        comparison={metrics.monthComparison}
        months={
          meta.dateRange.from && meta.dateRange.to
            ? monthsBetween(meta.dateRange.from, meta.dateRange.to)
            : []
        }
      />
      <InsightsPanel insights={metrics.insights} />
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <DimensionExplorer meta={meta} metrics={metrics} />
        <CustomerNeeds meta={meta} metrics={metrics} />
      </div>
      {/* min-w-0: permite que los gráficos se achiquen dentro de la grilla. */}
      <div className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="lg:col-span-2">
          <TimelineChart data={metrics.timeline} />
        </div>
        <SellerPerformance metrics={metrics} />
      </div>
    </div>
  );
}
