import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { ClientFilterService } from '../filters/client-filter.service';
import { toListItem } from './clients.mapper';
import { sortClients } from './clients.sorting';
import { ClientDetail, ClientListItem, Paginated } from './clients.types';
import { ClientsQueryDto } from './dto/clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly clientFilter: ClientFilterService,
  ) {}

  /** Filtra, ordena y pagina. */
  list(query: ClientsQueryDto): Paginated<ClientListItem> {
    const filtered = this.clientFilter.filter(query);
    const sorted = sortClients(filtered, query.sortBy, query.sortDir);
    const start = (query.page - 1) * query.pageSize;

    return {
      items: sorted.slice(start, start + query.pageSize).map(toListItem),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / query.pageSize)),
    };
  }

  findOne(id: string): ClientDetail {
    const client = this.repository.findById(id);
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return client;
  }
}
