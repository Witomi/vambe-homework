import { SellerCards } from '@/components/sellers/SellerCards';
import { SellerIndustryTable } from '@/components/sellers/SellerIndustryTable';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

/**
 * Vendedores: cómo le va a cada uno (ajustado por los rubros que recibe)
 * y su tasa de cierre en cada industria frente al equipo.
 */
export default async function SellersPage() {
  const [meta, data] = await Promise.all([api.meta(), api.sellers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendedores"
        description="Cómo le va a cada vendedor frente a lo esperado según los rubros de sus leads, y en qué industrias cierra mejor o peor que el equipo."
        aside={<CoverageNote meta={meta} />}
      />
      {data.baseRate === null ? (
        <p className="text-muted text-sm">
          Aún no hay reuniones analizadas con IA. Corre{' '}
          <code>npm run categorize</code> en el backend.
        </p>
      ) : (
        <>
          <SellerCards sellers={data.sellers} />
          <SellerIndustryTable
            sellerStats={data.sellers}
            industries={data.industries}
            minSample={data.minSample}
          />
        </>
      )}
    </div>
  );
}
