import { groupBy } from '../utils/collections';
import { CategorizedClient } from '../domain/client';
import { optionLabel } from '../domain/categories';
import { minReliableSample, rateStat } from '../analytics/rates';
import { ReplicableSolution } from './opportunities.types';

/** Casi todos piden FAQ: no distingue una solución de otra. */
const IGNORED_USE_CASES = new Set(['faq']);
export const MIN_INDUSTRIES = 4;
const TOP = 4;

/** Todos los pares (a, b) de una lista, en orden estable. */
function pairs(values: string[]): [string, string][] {
  const sorted = [...values].sort();
  return sorted.flatMap((first, index) =>
    sorted.slice(index + 1).map((second): [string, string] => [first, second]),
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
  const groups = groupBy(categorized, (client) => {
    const useCases = client.categories.useCases.filter(
      (useCase) => !IGNORED_USE_CASES.has(useCase),
    );
    return pairs(useCases).map((pair) => pair.join('+'));
  });

  return [...groups.entries()]
    .map(([signature, clients]) => {
      const industries = [
        ...new Set(clients.map((client) => client.categories.industry)),
      ]
        .filter((industry) => industry !== 'otro')
        .map((value) => ({ value, label: optionLabel('industry', value) }));
      return { signature, clients, industries };
    })
    .filter(
      ({ clients, industries }) =>
        clients.length >= min && industries.length >= MIN_INDUSTRIES,
    )
    .sort(
      (solutionA, solutionB) =>
        solutionB.industries.length - solutionA.industries.length ||
        solutionB.clients.length - solutionA.clients.length,
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
        (sum, client) => sum + (client.categories.monthlyInquiries ?? 0),
        0,
      ),
    }));
}

/** La integración más pedida, solo si la pide al menos un cuarto del grupo. */
function topIntegration(
  clients: readonly CategorizedClient[],
): ReplicableSolution['topIntegration'] {
  const groups = groupBy(clients, (client) =>
    client.categories.integrations.filter(
      (integration) => integration !== 'otro',
    ),
  );
  const [best] = [...groups.entries()].sort(
    (entryA, entryB) => entryB[1].length - entryA[1].length,
  );
  if (!best || best[1].length < clients.length / 4) return null;
  return { value: best[0], label: optionLabel('integrations', best[0]) };
}
