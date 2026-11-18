import { SearchX } from 'lucide-react';
import type { ClientsPage } from '@/lib/api/types';
import type { SearchParams } from '@/lib/filters/params';
import type { Labeler } from '@/lib/labels';
import { ClientRow } from './ClientRow';
import { SortableHeader } from './SortableHeader';

interface ClientsTableProps {
  page: ClientsPage;
  params: SearchParams;
  labels: Labeler;
  sortBy: string;
  sortDir: string;
}

export function ClientsTable({
  page,
  params,
  labels,
  sortBy,
  sortDir,
}: ClientsTableProps) {
  if (page.items.length === 0) {
    return (
      <div className="text-muted flex flex-col items-center gap-2 py-16 text-sm">
        <SearchX className="size-6" aria-hidden />
        Ningún cliente coincide con estos filtros.
      </div>
    );
  }

  const sortProps = { sortBy, sortDir, params };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-sm">
        <thead className="border-border text-muted border-b text-left text-xs">
          <tr>
            <SortableHeader field="name" {...sortProps}>
              Cliente
            </SortableHeader>
            <SortableHeader field="seller" {...sortProps}>
              Vendedor
            </SortableHeader>
            <SortableHeader field="meetingDate" {...sortProps}>
              Reunión
            </SortableHeader>
            <SortableHeader field="closed" {...sortProps}>
              Estado
            </SortableHeader>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Industria · Canal
            </th>
            <SortableHeader
              field="monthlyInquiries"
              className="text-right"
              {...sortProps}
            >
              Consultas/mes
            </SortableHeader>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Necesidad
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {page.items.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              params={params}
              labels={labels}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
