import { Client } from '../domain/client';
import { DIMENSIONS, DimensionKey } from '../domain/taxonomy';

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
];

export interface Feature {
  /** Nombre legible: "Tamaño: Grande", "Consultas/mes (escala log)". */
  label: string;
  /** Valor de la variable para un cliente. */
  value: (client: Client) => number;
}

/**
 * Define las variables del modelo a partir de la taxonomía.
 * - Una variable 0/1 por cada valor de cada dimensión ("one-hot").
 * - El volumen de consultas en escala logarítmica y estandarizado, más un
 *   indicador de "no lo mencionó".
 */
export function buildFeatures(categorized: readonly Client[]): Feature[] {
  const oneHot: Feature[] = CATEGORICAL.flatMap((key) =>
    DIMENSIONS[key].options.map((option) => ({
      label: `${DIMENSIONS[key].label}: ${option.label}`,
      value: (c: Client) => {
        const v = c.categories![key];
        return (
          Array.isArray(v) ? v.includes(option.value) : v === option.value
        )
          ? 1
          : 0;
      },
    })),
  );

  const logVolume = (c: Client) =>
    Math.log1p(c.categories!.monthlyInquiries ?? 0);
  const known = categorized.filter(
    (c) => c.categories!.monthlyInquiries !== null,
  );
  const mean =
    known.reduce((s, c) => s + logVolume(c), 0) / (known.length || 1);
  const std =
    Math.sqrt(
      known.reduce((s, c) => s + (logVolume(c) - mean) ** 2, 0) /
        (known.length || 1),
    ) || 1;

  return [
    ...oneHot,
    {
      label: 'Consultas/mes (más volumen)',
      value: (c) =>
        c.categories!.monthlyInquiries === null
          ? 0
          : (logVolume(c) - mean) / std,
    },
    {
      label: 'Consultas/mes: no lo menciona',
      value: (c) => (c.categories!.monthlyInquiries === null ? 1 : 0),
    },
  ];
}

export function toVector(client: Client, features: readonly Feature[]) {
  return features.map((f) => f.value(client));
}
