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

export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

export function predict(model: LogisticModel, x: readonly number[]): number {
  let z = model.intercept;
  for (let j = 0; j < x.length; j++) z += model.weights[j] * x[j];
  return sigmoid(z);
}

/**
 * Fila dispersa con el intercepto incluido en la posición 0: posiciones y
 * valores de las variables distintas de 0.
 */
interface SparseRow {
  index: Int32Array;
  value: Float64Array;
}

function toSparse(x: readonly number[]): SparseRow {
  const index = [0];
  const value = [1];
  x.forEach((v, j) => {
    if (v !== 0) {
      index.push(j + 1);
      value.push(v);
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
 */
export function train(
  X: readonly (readonly number[])[],
  y: readonly number[],
  options: TrainOptions = DEFAULT_TRAIN_OPTIONS,
): LogisticModel {
  const n = X.length;
  const d = (X[0]?.length ?? 0) + 1; // + intercepto
  const rows = X.map(toSparse);
  const rate = Math.min(
    Math.max(y.reduce((a, b) => a + b, 0) / n, 1e-3),
    1 - 1e-3,
  );
  const theta = new Float64Array(d);
  theta[0] = Math.log(rate / (1 - rate));

  for (let iter = 0; iter < options.maxIterations; iter++) {
    const gradient = new Float64Array(d);
    const hessian = new Float64Array(d * d);
    for (let j = 1; j < d; j++) {
      gradient[j] = options.l2 * theta[j];
      hessian[j * d + j] = options.l2;
    }

    for (let i = 0; i < n; i++) {
      const { index, value } = rows[i];
      let z = 0;
      for (let k = 0; k < index.length; k++) z += theta[index[k]] * value[k];
      const p = sigmoid(z);
      const error = p - y[i];
      const curvature = p * (1 - p);
      for (let a = 0; a < index.length; a++) {
        gradient[index[a]] += error * value[a];
        const row = index[a] * d;
        const scaled = curvature * value[a];
        for (let b = 0; b < index.length; b++) {
          hessian[row + index[b]] += scaled * value[b];
        }
      }
    }

    const step = solveSymmetric(hessian, gradient, d);
    let largest = 0;
    for (let j = 0; j < d; j++) {
      theta[j] -= step[j];
      largest = Math.max(largest, Math.abs(step[j]));
    }
    if (largest < TOLERANCE) break;
  }

  return { intercept: theta[0], weights: Array.from(theta.subarray(1)) };
}

/**
 * Resuelve A·x = b para A simétrica definida positiva (Cholesky).
 * Un mínimo en la diagonal evita divisiones por 0 si una variable nunca
 * aparece y no hay regularización.
 */
function solveSymmetric(
  A: Float64Array,
  b: Float64Array,
  d: number,
): Float64Array {
  const L = new Float64Array(d * d);
  for (let i = 0; i < d; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = A[i * d + j];
      for (let k = 0; k < j; k++) sum -= L[i * d + k] * L[j * d + k];
      L[i * d + j] =
        i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / L[j * d + j];
    }
  }
  // L·u = b, luego Lᵀ·x = u.
  const u = new Float64Array(d);
  for (let i = 0; i < d; i++) {
    let sum = b[i];
    for (let k = 0; k < i; k++) sum -= L[i * d + k] * u[k];
    u[i] = sum / L[i * d + i];
  }
  const x = new Float64Array(d);
  for (let i = d - 1; i >= 0; i--) {
    let sum = u[i];
    for (let k = i + 1; k < d; k++) sum -= L[k * d + i] * x[k];
    x[i] = sum / L[i * d + i];
  }
  return x;
}
