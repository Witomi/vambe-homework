import Link from 'next/link';
import type { ClientListItem } from '@/lib/api/types';
import type { SearchParams } from '@/lib/filters/params';
import { hrefWith } from '@/lib/filters/url';
import { formatDate, formatNumber } from '@/lib/format';
import type { Labeler } from '@/lib/labels';
import { Badge, ClosedBadge } from '../ui/Badge';
import { GradeBadge } from '../ui/GradeBadge';

interface ClientRowProps {
  client: ClientListItem;
  params: SearchParams;
  labels: Labeler;
}

/** Fila de la tabla; el nombre abre el detalle (`?cliente=<id>`). */
export function ClientRow({ client, params, labels }: ClientRowProps) {
  const { categories } = client;

  return (
    <tr className="hover:bg-background/60 group">
      <td className="px-4 py-3">
        {client.prediction ? (
          <GradeBadge
            grade={client.prediction.grade}
            probability={client.prediction.probability}
          />
        ) : (
          <span className="text-subtle text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Link
          href={hrefWith('/clientes', params, { cliente: client.id })}
          scroll={false}
          className="group-hover:text-brand font-medium"
        >
          {client.name}
        </Link>
        <div className="text-subtle text-xs">{client.email}</div>
      </td>
      <td className="px-4 py-3">{client.seller}</td>
      <td className="text-muted px-4 py-3 whitespace-nowrap">
        {formatDate(client.meetingDate)}
      </td>
      <td className="px-4 py-3">
        <ClosedBadge closed={client.closed} />
      </td>
      <td className="px-4 py-3">
        {categories ? (
          <div className="flex flex-wrap gap-1">
            <Badge tone="brand">
              {labels.value('industry', categories.industry)}
            </Badge>
            <Badge>{labels.value('leadSource', categories.leadSource)}</Badge>
          </div>
        ) : (
          <span className="text-subtle text-xs italic">Sin categorizar</span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatNumber(categories?.monthlyInquiries)}
      </td>
      <td className="text-muted max-w-sm px-4 py-3 text-xs">
        <span className="line-clamp-2">
          {categories?.summary || client.excerpt}
        </span>
      </td>
    </tr>
  );
}
