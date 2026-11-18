import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from 'lucide-react';
import Link from 'next/link';
import type { SearchParams } from '@/lib/filters';
import { formatDate, formatNumber } from '@/lib/format';
import type { Labeler } from '@/lib/labels';
import type { ClientListItem, Paginated } from '@/lib/types';
import { hrefWith } from '@/lib/url';
import { Badge, ClosedBadge } from '../ui/Badge';

interface Props {
  page: Paginated<ClientListItem>;
  params: SearchParams;
  labels: Labeler;
  sortBy: string;
  sortDir: string;
}

export function ClientsTable({ page, params, labels, sortBy, sortDir }: Props) {
  if (page.items.length === 0) {
    return (
      <div className="text-muted flex flex-col items-center gap-2 py-16 text-sm">
        <SearchX className="size-6" aria-hidden />
        Ningún cliente coincide con estos filtros.
      </div>
    );
  }

  const SortHeader = ({
    field,
    children,
    className,
  }: {
    field: string;
    children: React.ReactNode;
    className?: string;
  }) => {
    const active = sortBy === field;
    const nextDir = active && sortDir === 'desc' ? 'asc' : 'desc';
    const Icon = !active
      ? ArrowUpDown
      : sortDir === 'desc'
        ? ArrowDown
        : ArrowUp;
    return (
      <th
        scope="col"
        className={clsx('px-4 py-2.5 font-medium', className)}
        aria-sort={
          active ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined
        }
      >
        <Link
          href={hrefWith('/clientes', params, {
            sortBy: field,
            sortDir: nextDir,
            page: null,
          })}
          scroll={false}
          className={clsx(
            'inline-flex items-center gap-1',
            active ? 'text-foreground' : 'hover:text-foreground',
          )}
        >
          {children}
          <Icon className="size-3" aria-hidden />
        </Link>
      </th>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-sm">
        <thead className="border-border text-muted border-b text-left text-xs">
          <tr>
            <SortHeader field="name">Cliente</SortHeader>
            <SortHeader field="seller">Vendedor</SortHeader>
            <SortHeader field="meetingDate">Reunión</SortHeader>
            <SortHeader field="closed">Estado</SortHeader>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Industria · Canal
            </th>
            <SortHeader field="monthlyInquiries" className="text-right">
              Consultas/mes
            </SortHeader>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Necesidad
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {page.items.map((c) => (
            <tr key={c.id} className="hover:bg-background/60 group">
              <td className="px-4 py-3">
                <Link
                  href={hrefWith('/clientes', params, { cliente: c.id })}
                  scroll={false}
                  className="group-hover:text-brand font-medium"
                >
                  {c.name}
                </Link>
                <div className="text-subtle text-xs">{c.email}</div>
              </td>
              <td className="px-4 py-3">{c.seller}</td>
              <td className="text-muted px-4 py-3 whitespace-nowrap">
                {formatDate(c.meetingDate)}
              </td>
              <td className="px-4 py-3">
                <ClosedBadge closed={c.closed} />
              </td>
              <td className="px-4 py-3">
                {c.categories ? (
                  <div className="flex flex-wrap gap-1">
                    <Badge tone="brand">
                      {labels.value(
                        'industry',
                        c.categories.industry as string,
                      )}
                    </Badge>
                    <Badge>
                      {labels.value(
                        'leadSource',
                        c.categories.leadSource as string,
                      )}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-subtle text-xs italic">
                    Sin categorizar
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatNumber(c.categories?.monthlyInquiries)}
              </td>
              <td className="text-muted max-w-sm px-4 py-3 text-xs">
                <span className="line-clamp-2">
                  {c.categories?.summary || c.excerpt}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
