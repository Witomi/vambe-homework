import { DimensionExplorer } from '@/components/dashboard/DimensionExplorer';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { ProductDemand } from '@/components/dashboard/ProductDemand';
import { SellerIndustryHeatmap } from '@/components/dashboard/SellerIndustryHeatmap';
import { SellerPerformance } from '@/components/dashboard/SellerPerformance';
import { TimelineChart } from '@/components/dashboard/TimelineChart';
import { FilterBar } from '@/components/filters/FilterBar';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';
import { SearchParams, filterQuery } from '@/lib/filters/params';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = filterQuery(await searchParams);
  const [meta, metrics] = await Promise.all([api.meta(), api.metrics(query)]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Panel comercial"
        description="Qué clientes llegan, qué necesitan y qué los lleva a cerrar, a partir de las transcripciones de reuniones categorizadas con IA."
        aside={<CoverageNote meta={meta} />}
      />
      <FilterBar meta={meta} />
      <KpiCards kpis={metrics.kpis} />
      <InsightsPanel insights={metrics.insights} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TimelineChart data={metrics.timeline} />
        </div>
        <SellerPerformance metrics={metrics} />
      </div>
      <DimensionExplorer meta={meta} metrics={metrics} />
      <SellerIndustryHeatmap matrix={metrics.sellerIndustry} />
      <ProductDemand metrics={metrics} />
    </div>
  );
}
