import { CategorizedClient } from '../domain/client';
import { DIMENSIONS, DimensionKey } from '../domain/categories';

/** Dimensiones que entran al modelo como variables 0/1 (una por valor). */
const CATEGORICAL: DimensionKey[] = [
  'industry',
  'leadSource',
  'businessSize',
  'painPoint',
  'urgency',
  'complexity',
  'inquiryChannel',
  'useCases',
  'integrations',
  'requirements',
  'objections',
  'seasonality',
];

export interface Feature {
  /** Nombre legible: "Tamaño: Grande", "Consultas/mes (escala log)". */
  label: string;
  /** Valor de la variable para un cliente. */
  value: (client: CategorizedClient) => number;
}

/**
 * Define las variables del modelo a partir de la taxonomía y los datos.
 * - Una variable 0/1 por cada valor de cada dimensión ("one-hot").
 * - El vendedor que atendió y la combinación vendedor × industria (hay
 *   vendedores que cierran mucho mejor ciertos rubros). Los vendedores
 *   salen de los datos, no de una lista fija.
 * - El volumen de consultas en escala logarítmica y estandarizado, más un
 *   indicador de "no lo mencionó".
 */
export function buildFeatures(
  categorized: readonly CategorizedClient[],
): Feature[] {
  const oneHot: Feature[] = CATEGORICAL.flatMap((key) =>
    DIMENSIONS[key].options.map((option) => ({
      label: `${DIMENSIONS[key].label}: ${option.label}`,
      value: (client: CategorizedClient) => {
        const value = client.categories[key];
        return (
          Array.isArray(value)
            ? value.includes(option.value)
            : value === option.value
        )
          ? 1
          : 0;
      },
    })),
  );

  const sellers = [
    ...new Set(categorized.map((client) => client.seller)),
  ].sort();
  const bySeller: Feature[] = sellers.flatMap((seller) => [
    {
      label: `Vendedor: ${seller}`,
      value: (client: CategorizedClient) => (client.seller === seller ? 1 : 0),
    },
    ...DIMENSIONS.industry.options.map((industry) => ({
      label: `${seller} en ${industry.label}`,
      value: (client: CategorizedClient) =>
        client.seller === seller &&
        client.categories.industry === industry.value
          ? 1
          : 0,
    })),
  ]);

  const logVolume = (client: CategorizedClient) =>
    Math.log1p(client.categories.monthlyInquiries ?? 0);
  const known = categorized.filter(
    (client) => client.categories.monthlyInquiries !== null,
  );
  const mean =
    known.reduce((sum, client) => sum + logVolume(client), 0) /
    (known.length || 1);
  const std =
    Math.sqrt(
      known.reduce((sum, client) => sum + (logVolume(client) - mean) ** 2, 0) /
        (known.length || 1),
    ) || 1;

  return [
    ...oneHot,
    ...bySeller,
    {
      label: 'Consultas/mes (más volumen)',
      value: (client) =>
        client.categories.monthlyInquiries === null
          ? 0
          : (logVolume(client) - mean) / std,
    },
    {
      label: 'Consultas/mes: no lo menciona',
      value: (client) => (client.categories.monthlyInquiries === null ? 1 : 0),
    },
  ];
}

export function toVector(
  client: CategorizedClient,
  features: readonly Feature[],
) {
  return features.map((feature) => feature.value(client));
}
