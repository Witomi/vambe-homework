/** Métricas para evaluar probabilidades contra resultados reales (0/1). */

/**
 * AUC: probabilidad de que un cliente que cerró tenga una predicción más
 * alta que uno que no cerró. 0,5 = azar; 1 = ordena perfecto.
 * (Estadístico de Mann-Whitney, con empates contados a la mitad.)
 */
export function auc(
  probabilities: readonly number[],
  outcomes: readonly number[],
) {
  const ranked = probabilities
    .map((probability, index) => ({ probability, outcome: outcomes[index] }))
    .sort((clientA, clientB) => clientA.probability - clientB.probability);
  let positives = 0;
  let rankSum = 0;
  for (let start = 0; start < ranked.length;) {
    // Clientes con la misma probabilidad comparten el rango promedio.
    let end = start;
    while (
      end < ranked.length &&
      ranked[end].probability === ranked[start].probability
    ) {
      end++;
    }
    const averageRank = (start + 1 + end) / 2;
    for (let position = start; position < end; position++) {
      if (ranked[position].outcome === 1) {
        positives++;
        rankSum += averageRank;
      }
    }
    start = end;
  }
  const negatives = ranked.length - positives;
  if (positives === 0 || negatives === 0) return 0.5;
  return (
    (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives)
  );
}

/** Log loss (menor es mejor). */
export function logLoss(
  probabilities: readonly number[],
  outcomes: readonly number[],
) {
  // Evita log(0) cuando el modelo está seguro y se equivoca.
  const epsilon = 1e-12;
  const total = probabilities.reduce((sum, probability, index) => {
    const clamped = Math.min(Math.max(probability, epsilon), 1 - epsilon);
    return sum - (outcomes[index] ? Math.log(clamped) : Math.log(1 - clamped));
  }, 0);
  return total / probabilities.length;
}

export interface ProbabilityBin {
  /** Límites del rango de probabilidad (0..1). */
  from: number;
  to: number;
  closed: number;
  open: number;
  /** Probabilidad promedio predicha en el rango. */
  meanPredicted: number;
}

/** Agrupa a los clientes en rangos de probabilidad de ancho `width`. */
export function binByProbability(
  probabilities: readonly number[],
  outcomes: readonly number[],
  width: number,
): ProbabilityBin[] {
  const count = Math.round(1 / width);
  const bins = Array.from({ length: count }, (_, index) => ({
    from: index * width,
    to: (index + 1) * width,
    closed: 0,
    open: 0,
    probabilitySum: 0,
  }));
  probabilities.forEach((probability, index) => {
    const bin = bins[Math.min(count - 1, Math.floor(probability / width))];
    if (outcomes[index]) bin.closed++;
    else bin.open++;
    bin.probabilitySum += probability;
  });
  return bins.map(({ probabilitySum, ...bin }) => {
    const members = bin.closed + bin.open;
    return { ...bin, meanPredicted: members ? probabilitySum / members : 0 };
  });
}
