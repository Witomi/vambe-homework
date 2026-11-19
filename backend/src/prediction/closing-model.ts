import { chunk, seededShuffle } from '../common/sampling';
import { CategorizedClient } from '../domain/client';
import { buildFeatures, toVector } from './features';
import { predict, train } from './logistic-regression';
import { Factor } from './prediction.types';

const FOLDS = 5;
const SEED = 2024;

/** Modelo de probabilidad de cierre ya entrenado sobre los clientes categorizados. */
export interface ClosingModel {
  /** Probabilidad de cada cliente, predicha por un modelo que no lo vio al entrenar. */
  probabilities: ReadonlyMap<string, number>;
  /** Efecto de cada variable sobre las chances de cierre (modelo completo). */
  factors: readonly Factor[];
  folds: number;
  /** Las variables del cliente que más suben su probabilidad. */
  explain(client: CategorizedClient, max: number): Factor[];
}

const outcome = (c: CategorizedClient) => (c.closed ? 1 : 0);

/**
 * Entrena la regresión logística de cierre.
 *
 * - Validación cruzada de 5 partes: el modelo se entrena 5 veces dejando
 *   fuera un 20% distinto, y cada cliente recibe la probabilidad del modelo
 *   que no lo vio. Así las métricas de calidad son honestas.
 * - Un modelo final con todos los datos se usa solo para explicar qué
 *   variables pesan más (los factores).
 */
export function fitClosingModel(
  categorized: readonly CategorizedClient[],
): ClosingModel {
  const features = buildFeatures(categorized);
  const vectorOf = (c: CategorizedClient) => toVector(c, features);

  const probabilities = new Map<string, number>();
  const folds = chunk(
    seededShuffle(categorized, SEED),
    Math.ceil(categorized.length / FOLDS),
  );
  folds.forEach((testFold, k) => {
    const trainSet = folds.filter((_, i) => i !== k).flat();
    const model = train(trainSet.map(vectorOf), trainSet.map(outcome));
    for (const client of testFold) {
      probabilities.set(client.id, predict(model, vectorOf(client)));
    }
  });

  const full = train(categorized.map(vectorOf), categorized.map(outcome));
  const factors: Factor[] = full.weights.map((weight, j) => ({
    label: features[j].label,
    weight,
    oddsRatio: Math.exp(weight),
  }));

  return {
    probabilities,
    factors,
    folds: FOLDS,
    explain(client, max) {
      const x = vectorOf(client);
      return factors
        .map((factor, j) => ({ factor, contribution: factor.weight * x[j] }))
        .filter((c) => c.contribution > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, max)
        .map((c) => c.factor);
    },
  };
}
