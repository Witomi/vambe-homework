import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '../data/client.model';
import { ClientsRepository } from '../data/clients.repository';
import { applyFilters } from '../filters/apply-filters';
import { ClientsQueryDto, SortField } from './clients-query.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** En el listado se envía un extracto; la transcripción completa va en el detalle. */
export type ClientListItem = Omit<Client, 'transcript'> & { excerpt: string };

const EXCERPT_LENGTH = 160;

const sortValue: Record<SortField, (c: Client) => string | number> = {
  meetingDate: (c) => c.meetingDate,
  name: (c) => c.name,
  seller: (c) => c.seller,
  closed: (c) => Number(c.closed),
  monthlyInquiries: (c) => c.categories?.monthlyInquiries ?? -1,
};

@Injectable()
export class ClientsService {
  constructor(private readonly repository: ClientsRepository) {}

  list(query: ClientsQueryDto): Paginated<ClientListItem> {
    const filtered = applyFilters(this.repository.findAll(), query, (id) =>
      this.repository.searchableText(id),
    );

    const getValue = sortValue[query.sortBy];
    const direction = query.sortDir === 'asc' ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es');
      return cmp * direction;
    });

    const start = (query.page - 1) * query.pageSize;
    const items = sorted
      .slice(start, start + query.pageSize)
      .map(({ transcript, ...rest }) => ({
        ...rest,
        excerpt:
          transcript.length > EXCERPT_LENGTH
            ? `${transcript.slice(0, EXCERPT_LENGTH).trimEnd()}…`
            : transcript,
      }));

    return {
      items,
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / query.pageSize)),
    };
  }

  findOne(id: string): Client {
    const client = this.repository.findById(id);
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return client;
  }
}
