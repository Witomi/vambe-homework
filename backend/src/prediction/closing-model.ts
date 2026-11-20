import { chunk } from '../common/collections';
import { seededShuffle } from '../common/sampling';
import { CategorizedClient } from '../domain/client';
import { logLoss } from './evaluation';
import { buildFeatures, toVector } from './features';
import { DEFAULT_TRAIN_OPTIONS, predict, train } from './logistic-regression';
import { Factor } from './prediction.types';

const FOLDS = 5;
const SEED = 2024;

/**
 * Regularizaciones que se prueban en cada entrenamiento: menos regularización
 * deja que el modelo aprenda más detalle; más, lo protege de sobreajustar
 * grupos chicos. Con más datos, suele convenir menos.
 */
const L2_CANDIDATES = [3, 10, 30, 100];

/** Modelo de probabilidad de cierre ya entrenado sobre los clientes categorizados. */
export interface ClosingModel {
  /** Probabilidad de cada cliente, predicha por un modelo que no lo vio al entrenar. */
  probabilities: ReadonlyMap<string, number>;
  /** Efecto de cada variable sobre las chances de cierre (modelo completo). */
  factors: readonly Factor[];
  folds: number;
  /** Regularización elegida por validación cruzada. */
  l2: number;
  /** Vendedores que conoce el modelo. */
  sellers: readonly string[];
  /** Las variables del cliente que más suben su probabilidad. */
  explain(client: CategorizedClient, max: number): Factor[];
  /** Probabilidad (modelo completo) si al cliente lo atendiera `seller`. */
  probabilityWith(client: CategorizedClient, seller: string): number;
}

const outcome = (c: CategorizedClient) => (c.closed ? 1 : 0);

/**
 * Entrena la regresión logística de cierre.
 *
 * - Validación cruzada de 5 partes: el modelo se entrena dejando fuera un
 *   20% distinto cada vez, y cada cliente recibe la probabilidad del modelo
 *   que no lo vio. Así las métricas de calidad son honestas.
 * - La regularización se elige igual: la que da menor log loss en esa
 *   validación, entre `L2_CANDIDATES`. No hay un valor fijo.
 * - Un modelo final con todos los datos se usa para explicar qué variables
 *   pesan más y para simular otro vendedor.
 */
export function fitClosingModel(
  categorized: readonly CategorizedClient[],
): ClosingModel {
  const features = buildFeatures(categorized);
  // Cada vector se calcula una sola vez y se reutiliza en todas las partes.
  const vectors = new Map(
    categorized.map((c) => [c.id, toVector(c, features)] as const),
  );
  const vectorOf = (c: CategorizedClient) =>
    vectors.get(c.id) ?? toVector(c, features);

  const folds = chunk(
    seededShuffle(categorized, SEED),
    Math.ceil(categorized.length / FOLDS),
  );
  const crossValidate = (l2: number) => {
    const probabilities = new Map<string, number>();
    folds.forEach((testFold, k) => {
      const trainSet = folds.filter((_, i) => i !== k).flat();
      const model = train(trainSet.map(vectorOf), trainSet.map(outcome), {
        ...DEFAULT_TRAIN_OPTIONS,
        l2,
      });
      for (const client of testFold) {
        probabilities.set(client.id, predict(model, vectorOf(client)));
      }
    });
    const loss = logLoss(
      categorized.map((c) => probabilities.get(c.id) ?? 0),
      categorized.map(outcome),
    );
    return { l2, probabilities, loss };
  };
  const best = L2_CANDIDATES.map(crossValidate).reduce((a, b) =>
    b.loss < a.loss ? b : a,
  );

  const full = train(categorized.map(vectorOf), categorized.map(outcome), {
    ...DEFAULT_TRAIN_OPTIONS,
    l2: best.l2,
  });
  const factors: Factor[] = full.weights.map((weight, j) => ({
    label: features[j].label,
    weight,
    oddsRatio: Math.exp(weight),
  }));

  return {
    probabilities: best.probabilities,
    factors,
    folds: FOLDS,
    l2: best.l2,
    sellers: [...new Set(categorized.map((c) => c.seller))].sort(),
    explain(client, max) {
      const x = vectorOf(client);
      return factors
        .map((factor, j) => ({ factor, contribution: factor.weight * x[j] }))
        .filter((c) => c.contribution > 0)
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, max)
        .map((c) => c.factor);
    },
    probabilityWith(client, seller) {
      return predict(full, toVector({ ...client, seller }, features));
    },
  };
}
