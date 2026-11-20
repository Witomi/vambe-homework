import { groupBy } from '../common/collections';
import { CategorizedClient } from '../domain/client';
import { optionLabel } from '../domain/categories';
import { rateStat } from '../analytics/rates';
import { ReplicableSolution } from './opportunities.types';
import { minReliableSample } from '../analytics/rates';

/** Casi todos piden FAQ: no distingue una solución de otra. */
const IGNORED_USE_CASES = new Set(['faq']);
export const MIN_INDUSTRIES = 4;
const TOP = 4;

/** Todos los pares (a, b) de una lista, en orden estable. */
function pairs(values: string[]): [string, string][] {
  const sorted = [...values].sort();
  return sorted.flatMap((a, i) =>
    sorted.slice(i + 1).map((b): [string, string] => [a, b]),
  );
}

/**
 * Busca combinaciones de casos de uso que se repiten en muchas industrias
 * distintas: son candidatas a una plantilla de producto que se construye
 * una vez y se vende en varios rubros.
 */
export function findReplicableSolutions(
  categorized: readonly CategorizedClient[],
): ReplicableSolution[] {
  const min = minReliableSample(categorized.length);
  const groups = groupBy(categorized, (c) => {
    const useCases = c.categories.useCases.filter(
      (u) => !IGNORED_USE_CASES.has(u),
    );
    return pairs(useCases).map((p) => p.join('+'));
  });

  return [...groups.entries()]
    .map(([signature, clients]) => {
      const industries = [...new Set(clients.map((c) => c.categories.industry))]
        .filter((i) => i !== 'otro')
        .map((value) => ({ value, label: optionLabel('industry', value) }));
      return { signature, clients, industries };
    })
    .filter(
      ({ clients, industries }) =>
        clients.length >= min && industries.length >= MIN_INDUSTRIES,
    )
    .sort(
      (a, b) =>
        b.industries.length - a.industries.length ||
        b.clients.length - a.clients.length,
    )
    .slice(0, TOP)
    .map(({ signature, clients, industries }) => ({
      useCases: signature
        .split('+')
        .map((value) => ({ value, label: optionLabel('useCases', value) })),
      topIntegration: topIntegration(clients),
      clients: clients.length,
      industries,
      closeRate: rateStat(clients).closeRate ?? 0,
      monthlyInquiries: clients.reduce(
        (sum, c) => sum + (c.categories.monthlyInquiries ?? 0),
        0,
      ),
    }));
}

/** La integración más pedida, solo si la pide al menos un cuarto del grupo. */
function topIntegration(
  clients: readonly CategorizedClient[],
): ReplicableSolution['topIntegration'] {
  const groups = groupBy(clients, (c) =>
    c.categories.integrations.filter((i) => i !== 'otro'),
  );
  const [best] = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );
  if (!best || best[1].length < clients.length / 4) return null;
  return { value: best[0], label: optionLabel('integrations', best[0]) };
}
