import { Client } from '../domain/client';
import { SortDirection, SortField } from './dto/clients-query.dto';

/** Probabilidad de cierre de un cliente (undefined si no está categorizado). */
export type ProbabilityOf = (id: string) => number | undefined;

/** Valor por el que se ordena cada campo. Sin categorizar = al final. */
const sortValue = (
  probabilityOf: ProbabilityOf,
): Record<SortField, (client: Client) => string | number> => ({
  meetingDate: (client) => client.meetingDate,
  name: (client) => client.name,
  seller: (client) => client.seller,
  closed: (client) => Number(client.closed),
  monthlyInquiries: (client) => client.categories?.monthlyInquiries ?? -1,
  probability: (client) => probabilityOf(client.id) ?? -1,
});

export function sortClients(
  clients: readonly Client[],
  field: SortField,
  direction: SortDirection,
  probabilityOf: ProbabilityOf,
): Client[] {
  const valueOf = sortValue(probabilityOf)[field];
  const sign = direction === 'asc' ? 1 : -1;

  return [...clients].sort((clientA, clientB) => {
    const valueA = valueOf(clientA);
    const valueB = valueOf(clientB);
    const comparison =
      typeof valueA === 'number' && typeof valueB === 'number'
        ? valueA - valueB
        : String(valueA).localeCompare(String(valueB), 'es');
    return comparison * sign;
  });
}
