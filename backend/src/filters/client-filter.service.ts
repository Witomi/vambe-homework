import { Injectable } from '@nestjs/common';
import { ClientsRepository } from '../data/clients.repository';
import { PredictionService } from '../prediction/prediction.service';
import { Client } from '../domain/client';
import { applyFilters } from './apply-filters';
import { ClientFilterDto } from './client-filter.dto';

/**
 * Punto único para obtener el segmento de clientes que corresponde a un
 * filtro. Lo usan la tabla de clientes y las métricas, así ambas vistas
 * siempre muestran exactamente el mismo conjunto.
 */
@Injectable()
export class ClientFilterService {
  constructor(
    private readonly repository: ClientsRepository,
    private readonly prediction: PredictionService,
  ) {}

  filter(filter: ClientFilterDto): Client[] {
    return applyFilters(this.repository.findAll(), filter, {
      searchableText: (id) => this.repository.searchableText(id),
      gradeOf: (id) => this.prediction.predictionOf(id)?.grade,
    });
  }
}
