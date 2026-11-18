import { ClientDrawer } from '@/components/clients/ClientDrawer';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { Pagination } from '@/components/clients/Pagination';
import { FilterBar } from '@/components/filters/FilterBar';
import { CoverageNote, PageHeader } from '@/components/ui/PageHeader';
import { ApiError, api } from '@/lib/api';
import { SearchParams, filterQuery } from '@/lib/filters/params';
import { createLabeler } from '@/lib/labels';

const single = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const query = filterQuery(params);
  for (const key of ['page', 'sortBy', 'sortDir'] as const) {
    const value = single(params[key]);
    if (value) query.set(key, value);
  }
  const selectedId = single(params.cliente);

  const [meta, page, selected] = await Promise.all([
    api.meta(),
    api.clients(query),
    selectedId
      ? api.client(selectedId).catch((e: unknown) => {
          if (e instanceof ApiError && e.status === 404) return null;
          throw e;
        })
      : Promise.resolve(null),
  ]);
  const labels = createLabeler(meta);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Busca y filtra reuniones por cualquier dimensión. Abre un cliente para ver su transcripción y cómo la interpretó el LLM."
        aside={<CoverageNote meta={meta} />}
      />
      <FilterBar meta={meta} />
      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        <ClientsTable
          page={page}
          params={params}
          labels={labels}
          sortBy={query.get('sortBy') ?? 'meetingDate'}
          sortDir={query.get('sortDir') ?? 'desc'}
        />
        <Pagination page={page} params={params} />
      </div>
      {selected && (
        <ClientDrawer client={selected} meta={meta} params={params} />
      )}
    </div>
  );
}
