import { Client } from '../domain/client';
import { SortDirection, SortField } from './dto/clients-query.dto';

/** Probabilidad de cierre de un cliente (undefined si no está categorizado). */
export type ProbabilityOf = (id: string) => number | undefined;

/** Valor por el que se ordena cada campo. Sin categorizar = al final. */
const sortValue = (
  probabilityOf: ProbabilityOf,
): Record<SortField, (c: Client) => string | number> => ({
  meetingDate: (c) => c.meetingDate,
  name: (c) => c.name,
  seller: (c) => c.seller,
  closed: (c) => Number(c.closed),
  monthlyInquiries: (c) => c.categories?.monthlyInquiries ?? -1,
  probability: (c) => probabilityOf(c.id) ?? -1,
});

export function sortClients(
  clients: readonly Client[],
  field: SortField,
  direction: SortDirection,
  probabilityOf: ProbabilityOf,
): Client[] {
  const valueOf = sortValue(probabilityOf)[field];
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
