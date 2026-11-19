import { Blockers } from '@/components/opportunities/Blockers';
import { DetailProvider } from '@/components/opportunities/DetailDrawer';
import { LeadRecovery } from '@/components/opportunities/LeadRecovery';
import { ReplicableSolutions } from '@/components/opportunities/ReplicableSolutions';
import { SegmentMap } from '@/components/opportunities/SegmentMap';
import { SellerAssignments } from '@/components/opportunities/SellerAssignments';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

/**
 * Oportunidades: convierte las categorías en acciones concretas.
 * Cada bloque responde una pregunta del equipo y enlaza al detalle.
 */
export default async function OpportunitiesPage() {
  const [meta, data] = await Promise.all([api.meta(), api.opportunities()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades"
        description="Qué hacer con estos datos: dónde enfocarse, a quién volver a llamar, quién toma cada lead, qué resolver y qué construir."
        aside={<CoverageNote meta={meta} />}
      />
      {data.baseRate === null ? (
        <p className="text-muted text-sm">
          Aún no hay reuniones analizadas con IA. Corre{' '}
          <code>npm run categorize</code> en el backend.
        </p>
      ) : (
        <DetailProvider>
          <SegmentMap quadrants={data.quadrants} baseRate={data.baseRate} />
          <LeadRecovery recovery={data.recovery} baseRate={data.baseRate} />
          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            <SellerAssignments assignments={data.assignments} />
            <Blockers blockers={data.blockers} baseRate={data.baseRate} />
          </div>
          <ReplicableSolutions solutions={data.solutions} />
        </DetailProvider>
      )}
    </div>
  );
}
