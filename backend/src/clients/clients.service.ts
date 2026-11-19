import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { ClientFilterService } from '../filters/client-filter.service';
import { PredictionService } from '../prediction/prediction.service';
import { toListItem } from './clients.mapper';
import { sortClients } from './clients.sorting';
import { ClientDetail, ClientListItem, Paginated } from './clients.types';
import { ClientsQueryDto } from './dto/clients-query.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly clientFilter: ClientFilterService,
    private readonly prediction: PredictionService,
  ) {}

  /** Filtra, ordena y pagina. */
  list(query: ClientsQueryDto): Paginated<ClientListItem> {
    const filtered = this.clientFilter.filter(query);
    const sorted = sortClients(filtered, query.sortBy, query.sortDir, (id) =>
      this.prediction.probabilityOf(id),
    );
    const start = (query.page - 1) * query.pageSize;

    return {
      items: sorted
        .slice(start, start + query.pageSize)
        .map((c) => toListItem(c, this.prediction.predictionOf(c.id))),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / query.pageSize)),
    };
  }

  findOne(id: string): ClientDetail {
    const client = this.repository.findById(id);
    if (!client) throw new NotFoundException(`Cliente ${id} no encontrado`);
    return { ...client, prediction: this.prediction.predictionOf(id) };
  }
}
