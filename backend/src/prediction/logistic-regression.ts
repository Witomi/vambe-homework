/**
 * Regresión logística con regularización L2, entrenada con el método de
 * Newton (IRLS, el mismo de R o statsmodels). Implementación mínima y sin
 * dependencias: con ~80 variables converge al óptimo exacto en ~10 pasos,
 * y como casi todas las variables son 0/1 (la mayoría en 0), cada fila se
 * recorre en forma dispersa. 10.000 filas entrenan en milisegundos.
 */

export interface LogisticModel {
  intercept: number;
  weights: number[];
}

export interface TrainOptions {
  /** Fuerza de la regularización L2 (evita sobreajustar grupos chicos). */
  l2: number;
  /** Tope de pasos de Newton (suele converger en menos de 10). */
  maxIterations: number;
}

/**
 * Valores por defecto. En la app, `l2` lo elige la validación cruzada en
 * cada entrenamiento (ver `closing-model.ts`), según los datos de ese momento.
 */
export const DEFAULT_TRAIN_OPTIONS: TrainOptions = {
  l2: 10,
  maxIterations: 50,
};

/** Se detiene cuando ningún coeficiente cambia más que esto. */
const TOLERANCE = 1e-8;

/** Convierte un puntaje (log-odds) en probabilidad entre 0 y 1. */
export const sigmoid = (score: number): number => 1 / (1 + Math.exp(-score));

/** Probabilidad que el modelo asigna a un vector de variables. */
export function predict(
  model: LogisticModel,
  features: readonly number[],
): number {
  let score = model.intercept;
  for (let i = 0; i < features.length; i++) {
    score += model.weights[i] * features[i];
  }
  return sigmoid(score);
}

/**
 * Fila dispersa con el intercepto incluido en la posición 0: posiciones y
 * valores de las variables distintas de 0.
 */
interface SparseRow {
  index: Int32Array;
  value: Float64Array;
}

function toSparse(features: readonly number[]): SparseRow {
  const index = [0];
  const value = [1];
  features.forEach((featureValue, position) => {
    if (featureValue !== 0) {
      index.push(position + 1);
      value.push(featureValue);
    }
  });
  return { index: Int32Array.from(index), value: Float64Array.from(value) };
}

/**
 * Minimiza Σ log loss + (l2 / 2)·‖w‖². El intercepto no se regulariza y
 * parte del log-odds de la tasa base.
 *
 * Cada paso de Newton resuelve (Xᵀ·W·X + l2·I)·Δ = Xᵀ·(p − y) + l2·w, con
 * W = p·(1 − p): usa la curvatura de la función, por eso converge en pocos
 * pasos en vez de los cientos del descenso de gradiente.
 *
 * @param features una fila por cliente (la X de la fórmula)
 * @param labels 1 si cerró, 0 si no (la y de la fórmula)
 */
export function train(
  features: readonly (readonly number[])[],
  labels: readonly number[],
  options: TrainOptions = DEFAULT_TRAIN_OPTIONS,
): LogisticModel {
  const rowCount = features.length;
  const size = (features[0]?.length ?? 0) + 1; // variables + intercepto
  const rows = features.map(toSparse);
  const closedCount = labels.reduce((sum, label) => sum + label, 0);
  const baseRate = Math.min(Math.max(closedCount / rowCount, 1e-3), 1 - 1e-3);
  const coefficients = new Float64Array(size);
  coefficients[0] = Math.log(baseRate / (1 - baseRate));

  for (let iteration = 0; iteration < options.maxIterations; iteration++) {
    // La regularización aporta l2·w al gradiente y l2 a la diagonal (no al intercepto).
    const gradient = new Float64Array(size);
    const hessian = new Float64Array(size * size);
    for (let j = 1; j < size; j++) {
      gradient[j] = options.l2 * coefficients[j];
      hessian[j * size + j] = options.l2;
    }

    for (let row = 0; row < rowCount; row++) {
      const { index, value } = rows[row];
      let score = 0;
      for (let k = 0; k < index.length; k++) {
        score += coefficients[index[k]] * value[k];
      }
      const probability = sigmoid(score);
      const error = probability - labels[row];
      const curvature = probability * (1 - probability);
      for (let first = 0; first < index.length; first++) {
        gradient[index[first]] += error * value[first];
        const hessianRow = index[first] * size;
        const scaled = curvature * value[first];
        for (let second = 0; second < index.length; second++) {
          hessian[hessianRow + index[second]] += scaled * value[second];
        }
      }
    }

    const step = solveSymmetric(hessian, gradient, size);
    let largestChange = 0;
    for (let j = 0; j < size; j++) {
      coefficients[j] -= step[j];
      largestChange = Math.max(largestChange, Math.abs(step[j]));
    }
    if (largestChange < TOLERANCE) break;
  }

  return {
    intercept: coefficients[0],
    weights: Array.from(coefficients.subarray(1)),
  };
}

/**
 * Resuelve matrix·x = rightSide para una matriz simétrica definida positiva
 * (descomposición de Cholesky: matrix = L·Lᵀ). Un mínimo en la diagonal
 * evita divisiones por 0 si una variable nunca aparece y no hay regularización.
 */
function solveSymmetric(
  matrix: Float64Array,
  rightSide: Float64Array,
  size: number,
): Float64Array {
  const lower = new Float64Array(size * size);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = matrix[i * size + j];
      for (let k = 0; k < j; k++)
        sum -= lower[i * size + k] * lower[j * size + k];
      lower[i * size + j] =
        i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / lower[j * size + j];
    }
  }
  // Primero L·forward = rightSide, luego Lᵀ·solution = forward.
  const forward = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    let sum = rightSide[i];
    for (let k = 0; k < i; k++) sum -= lower[i * size + k] * forward[k];
    forward[i] = sum / lower[i * size + i];
  }
  const solution = new Float64Array(size);
  for (let i = size - 1; i >= 0; i--) {
    let sum = forward[i];
    for (let k = i + 1; k < size; k++) sum -= lower[k * size + i] * solution[k];
    solution[i] = sum / lower[i * size + i];
  }
  return solution;
}
