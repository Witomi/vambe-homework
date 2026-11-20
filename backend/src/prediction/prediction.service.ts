import { Injectable } from '@nestjs/common';
import { CategorizationStore } from '../data/categorization.store';
import { ClientsRepository } from '../data/clients.repository';
import { pointsDiff } from '../analytics/rates';
import { CategorizedClient } from '../domain/client';
import { ClientPrediction, gradeOf } from '../domain/grades';
import { ClosingModel, fitClosingModel } from './closing-model';
import { buildModelReport } from './model-report';
import {
  Factor,
  PredictionResponse,
  SellerSuggestion,
} from './prediction.types';

interface Snapshot {
  revision: number;
  model: ClosingModel;
  report: PredictionResponse;
}

/**
 * Probabilidad de cierre de cada cliente (regresión logística sobre las
 * categorías del LLM). Entrena una vez por versión de los datos y la
 * reutiliza: los clientes, filtros y oportunidades consultan aquí.
 */
@Injectable()
export class PredictionService {
  private snapshot: Snapshot | null = null;

  constructor(
    private readonly repository: ClientsRepository,
    private readonly store: CategorizationStore,
  ) {}

  /** Calidad, notas, distribución y factores del modelo. */
  summary(): PredictionResponse {
    return this.current().report;
  }

  /** Probabilidad de cierre estimada de un cliente categorizado. */
  probabilityOf(clientId: string): number | undefined {
    return this.current().model.probabilities.get(clientId);
  }

  /** Probabilidad y nota (A–F) de un cliente, o null si no está categorizado. */
  predictionOf(clientId: string): ClientPrediction | null {
    const probability = this.probabilityOf(clientId);
    return probability === undefined
      ? null
      : { probability, grade: gradeOf(probability) };
  }

  /** Las variables del cliente que más suben su probabilidad. */
  reasonsFor(client: CategorizedClient, max = 2): Factor[] {
    return this.current().model.explain(client, max);
  }

  /**
   * El vendedor con el que el modelo estima la mayor probabilidad de cierre
   * para este cliente, si no es el que lo atendió y la mejora se nota (al
   * menos 1 punto). Compara siempre con el mismo modelo (el completo).
   */
  bestSellerFor(client: CategorizedClient): SellerSuggestion | null {
    const { model } = this.current();
    const current = model.probabilityWith(client, client.seller);
    const best = model.sellers
      .map((seller) => ({
        seller,
        probability: model.probabilityWith(client, seller),
      }))
      .reduce((a, b) => (b.probability > a.probability ? b : a));
    const gainPts = pointsDiff(best.probability, current);
    return best.seller !== client.seller && gainPts >= 1
      ? { seller: best.seller, gainPts }
      : null;
  }

  /**
   * Entrena el modelo de inmediato (en vez de esperar la primera consulta)
   * y devuelve cuánto tardó. Se llama al arrancar el servidor.
   */
  warmUp(): number {
    const startedAt = Date.now();
    this.current();
    return Date.now() - startedAt;
  }

  /** Reentrena solo si cambiaron las categorizaciones. */
  private current(): Snapshot {
    if (this.snapshot?.revision !== this.store.revision) {
      const categorized = this.repository.findCategorized();
      const model = fitClosingModel(categorized);
      this.snapshot = {
        revision: this.store.revision,
        model,
        report: buildModelReport(categorized, model),
      };
    }
    return this.snapshot;
  }
}
