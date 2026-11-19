import { Injectable } from '@nestjs/common';
import { CategorizationStore } from '../data/categorization.store';
import { ClientsRepository } from '../data/clients.repository';
import { Client } from '../domain/client';
import { chunk, seededShuffle } from '../categorization/utils/sampling';
import { auc, binByProbability, logLoss } from './evaluation';
import { buildFeatures, toVector } from './features';
import { predict, train } from './logistic-regression';
import { GRADES, gradeOf, gradeRange } from './grades';
import {
  ClientPoint,
  ClientPrediction,
  Factor,
  GradeSummary,
  PredictionResponse,
} from './prediction.types';

const FOLDS = 5;
const SEED = 2024;
const BUCKET_WIDTH = 0.05;
const TOP_FACTORS = 6;

interface Snapshot {
  revision: number;
  /** Probabilidad de cada cliente, predicha sin haberlo visto al entrenar. */
  probabilities: Map<string, number>;
  /** Variables del cliente que más suben su probabilidad (modelo completo). */
  explain: (client: Client, max: number) => Factor[];
  response: PredictionResponse;
}

/**
 * Probabilidad de cierre con regresión logística sobre las categorías del LLM.
 *
 * Validación cruzada de 5 partes: el modelo se entrena 5 veces dejando
 * fuera un 20% distinto cada vez, y cada cliente recibe la probabilidad del
 * modelo que no lo vio. Así las métricas de calidad son honestas (no
 * evalúan sobre los mismos datos con que se entrenó).
 */
@Injectable()
export class PredictionService {
  private snapshot: Snapshot | null = null;

  constructor(
    private readonly repository: ClientsRepository,
    private readonly store: CategorizationStore,
  ) {}

  /** Métricas, distribución y factores del modelo. */
  summary(): PredictionResponse {
    return this.current().response;
  }

  /** Probabilidad de cierre estimada de un cliente categorizado. */
  probabilityOf(clientId: string): number | undefined {
    return this.current().probabilities.get(clientId);
  }

  /** Probabilidad y nota (A–D) de un cliente, o null si no está categorizado. */
  predictionOf(clientId: string): ClientPrediction | null {
    const probability = this.probabilityOf(clientId);
    return probability === undefined
      ? null
      : { probability, grade: gradeOf(probability) };
  }

  /** Las variables del cliente que más suben su probabilidad. */
  reasonsFor(client: Client, max = 2): Factor[] {
    return this.current().explain(client, max);
  }

  private current(): Snapshot {
    if (this.snapshot?.revision !== this.store.revision) {
      this.snapshot = {
        revision: this.store.revision,
        ...this.fit(this.repository.findAll().filter((c) => c.categories)),
      };
    }
    return this.snapshot;
  }

  private fit(categorized: Client[]): Omit<Snapshot, 'revision'> {
    const features = buildFeatures(categorized);
    const outcome = (c: Client) => (c.closed ? 1 : 0);
    const probabilities = new Map<string, number>();

    // Validación cruzada: cada cliente se predice con un modelo que no lo vio.
    const folds = chunk(
      seededShuffle(categorized, SEED),
      Math.ceil(categorized.length / FOLDS),
    );
    folds.forEach((testFold, k) => {
      const trainSet = folds.filter((_, i) => i !== k).flat();
      const model = train(
        trainSet.map((c) => toVector(c, features)),
        trainSet.map(outcome),
      );
      for (const c of testFold) {
        probabilities.set(c.id, predict(model, toVector(c, features)));
      }
    });

    const probs = categorized.map((c) => probabilities.get(c.id)!);
    const outcomes = categorized.map(outcome);
    const baseRate = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;

    // Modelo final con todos los datos, solo para explicar los factores.
    const full = train(
      categorized.map((c) => toVector(c, features)),
      outcomes,
    );
    const factors: Factor[] = full.weights.map((weight, j) => ({
      label: features[j].label,
      weight,
      oddsRatio: Math.exp(weight),
    }));

    const explain = (client: Client, max: number) => {
      const x = toVector(client, features);
      return factors
        .map((f, j) => ({ factor: f, contribution: f.weight * x[j] }))
        .filter((c) => c.contribution > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, max)
        .map((c) => c.factor);
    };

    return {
      probabilities,
      explain,
      response: {
        quality: {
          sampleSize: categorized.length,
          baseRate,
          auc: auc(probs, outcomes),
          logLoss: logLoss(probs, outcomes),
          baselineLogLoss: logLoss(
            probs.map(() => baseRate),
            outcomes,
          ),
          folds: FOLDS,
        },
        grades: summarizeGrades(probs, outcomes),
        gradeThresholds: GRADES.map(({ grade, min }) => ({
          grade,
          minScore: min > 0 ? logit(min) : null,
        })),
        points: categorized.map((c, i): ClientPoint => ({
          id: c.id,
          name: c.name,
          score: logit(probs[i]),
          probability: probs[i],
          closed: c.closed,
          grade: gradeOf(probs[i]),
        })),
        buckets: binByProbability(probs, outcomes, BUCKET_WIDTH),
        factors: {
          positive: [...factors]
            .filter((f) => f.weight > 0)
            .sort((a, b) => b.weight - a.weight)
            .slice(0, TOP_FACTORS),
          negative: [...factors]
            .filter((f) => f.weight < 0)
            .sort((a, b) => a.weight - b.weight)
            .slice(0, TOP_FACTORS),
        },
      },
    };
  }
}

/** Cuántos clientes hay en cada nota y cuánto cerraron realmente. */
function summarizeGrades(
  probs: readonly number[],
  outcomes: readonly number[],
): GradeSummary[] {
  return GRADES.map(({ grade, title, action }) => {
    const members = probs
      .map((p, i) => ({ p, y: outcomes[i] }))
      .filter(({ p }) => gradeOf(p) === grade);
    const closed = members.filter((m) => m.y === 1).length;
    return {
      grade,
      title,
      action,
      range: gradeRange(grade),
      count: members.length,
      closed,
      closeRate: members.length ? closed / members.length : null,
    };
  });
}

/** Inversa de la sigmoide: probabilidad → puntaje (log-odds). */
function logit(p: number): number {
  return Math.log(p / (1 - p));
}
