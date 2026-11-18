import { Client } from '../domain/client';
import { SortDirection, SortField } from './dto/clients-query.dto';

/** Valor por el que se ordena cada campo. Sin categorizar = al final. */
const SORT_VALUE: Record<SortField, (c: Client) => string | number> = {
  meetingDate: (c) => c.meetingDate,
  name: (c) => c.name,
  seller: (c) => c.seller,
  closed: (c) => Number(c.closed),
  monthlyInquiries: (c) => c.categories?.monthlyInquiries ?? -1,
};

export function sortClients(
  clients: readonly Client[],
  field: SortField,
  direction: SortDirection,
): Client[] {
  const valueOf = SORT_VALUE[field];
  const sign = direction === 'asc' ? 1 : -1;

  return [...clients].sort((a, b) => {
    const va = valueOf(a);
    const vb = valueOf(b);
    const comparison =
      typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es');
    return comparison * sign;
  });
}
