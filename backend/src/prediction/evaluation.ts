/** Métricas para evaluar probabilidades contra resultados reales (0/1). */

/**
 * AUC: probabilidad de que un cliente que cerró tenga una predicción más
 * alta que uno que no cerró. 0,5 = azar; 1 = ordena perfecto.
 * (Estadístico de Mann-Whitney, con empates contados a la mitad.)
 */
export function auc(probs: readonly number[], outcomes: readonly number[]) {
  const ranked = probs
    .map((p, i) => ({ p, y: outcomes[i] }))
    .sort((a, b) => a.p - b.p);
  let positives = 0;
  let rankSum = 0;
  for (let i = 0; i < ranked.length;) {
    let j = i;
    while (j < ranked.length && ranked[j].p === ranked[i].p) j++;
    const averageRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      if (ranked[k].y === 1) {
        positives++;
        rankSum += averageRank;
      }
    }
    i = j;
  }
  const negatives = ranked.length - positives;
  if (positives === 0 || negatives === 0) return 0.5;
  return (
    (rankSum - (positives * (positives + 1)) / 2) / (positives * negatives)
  );
}

/** Log loss (menor es mejor). */
export function logLoss(probs: readonly number[], outcomes: readonly number[]) {
  const eps = 1e-12;
  const total = probs.reduce((sum, p, i) => {
    const q = Math.min(Math.max(p, eps), 1 - eps);
    return sum - (outcomes[i] ? Math.log(q) : Math.log(1 - q));
  }, 0);
  return total / probs.length;
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
  probs: readonly number[],
  outcomes: readonly number[],
  width: number,
): ProbabilityBin[] {
  const count = Math.round(1 / width);
  const bins = Array.from({ length: count }, (_, i) => ({
    from: i * width,
    to: (i + 1) * width,
    closed: 0,
    open: 0,
    sum: 0,
  }));
  probs.forEach((p, i) => {
    const bin = bins[Math.min(count - 1, Math.floor(p / width))];
    if (outcomes[i]) bin.closed++;
    else bin.open++;
    bin.sum += p;
  });
  return bins.map(({ sum, ...bin }) => ({
    ...bin,
    meanPredicted: bin.closed + bin.open ? sum / (bin.closed + bin.open) : 0,
  }));
}
