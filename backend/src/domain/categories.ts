/**
 * Tipos y utilidades sobre la taxonomía de `dimensions.ts`: el tipo de una
 * categorización, las listas de dimensiones y cómo se muestran o filtran
 * sus valores.
 */
import { DIMENSIONS, DimensionDefinition, DimensionOption } from './dimensions';

export { DIMENSIONS };
export type { DimensionDefinition, DimensionOption };

export type DimensionKey = keyof typeof DIMENSIONS;

type OptionValue<K extends DimensionKey> =
  (typeof DIMENSIONS)[K]['options'][number]['value'];

export type SingleDimensionKey = {
  [K in DimensionKey]: (typeof DIMENSIONS)[K]['multi'] extends false
    ? K
    : never;
}[DimensionKey];

export type MultiDimensionKey = Exclude<DimensionKey, SingleDimensionKey>;

/** Resultado de categorizar una transcripción. */
export type Categories = {
  [K in SingleDimensionKey]: OptionValue<K>;
} & {
  [K in MultiDimensionKey]: OptionValue<K>[];
} & {
  /** Consultas mensuales normalizadas (diarias × 30, semanales × 4,3). */
  monthlyInquiries: number | null;
  /** Consultas al mes en los peaks, si el cliente da esa cifra. */
  peakMonthlyInquiries: number | null;
  /** Resumen de una línea de la necesidad del cliente. */
  summary: string;
};

export const DIMENSION_KEYS = Object.keys(DIMENSIONS) as DimensionKey[];

export const SINGLE_DIMENSION_KEYS = DIMENSION_KEYS.filter(
  (k) => !DIMENSIONS[k].multi,
) as SingleDimensionKey[];

export const MULTI_DIMENSION_KEYS = DIMENSION_KEYS.filter(
  (k) => DIMENSIONS[k].multi,
) as MultiDimensionKey[];

/** Se calcula en código a partir de otras dimensiones (no la responde el LLM). */
export function isDerived(key: DimensionKey): boolean {
  const definition: DimensionDefinition = DIMENSIONS[key];
  return definition.derived === true;
}

/** Dimensiones que responde el LLM. */
export const LLM_DIMENSION_KEYS = DIMENSION_KEYS.filter((k) => !isDerived(k));

/** Etiqueta legible de un valor: ('industry', 'salud') → "Salud / Clínicas". */
export function optionLabel(key: DimensionKey, value: string): string {
  return DIMENSIONS[key].options.find((o) => o.value === value)?.label ?? value;
}

export function optionValues(key: DimensionKey): string[] {
  return DIMENSIONS[key].options.map((o) => o.value);
}

/**
 * Valor sintético para dimensiones de lista: el cliente no mencionó nada
 * (p. ej. ninguna integración). No es una opción para el LLM —una lista
 * vacía ya lo expresa—, pero sí se muestra en métricas y filtros para que
 * los porcentajes cuenten a todos los clientes.
 */
export const NOT_MENTIONED: DimensionOption = {
  value: 'no_menciona',
  label: 'No lo menciona',
};

/** Opciones visibles para filtrar y mostrar: las del LLM + "No lo menciona" en listas. */
export function displayOptions(key: DimensionKey): DimensionOption[] {
  const options = [...DIMENSIONS[key].options];
  return DIMENSIONS[key].multi ? [...options, NOT_MENTIONED] : options;
}

/**
 * Valores comodín que no sirven para decidir nada: un hallazgo sobre
 * "Otro" o "No lo menciona" no es accionable.
 */
const NON_ACTIONABLE_VALUES = new Set([
  'otro',
  'no_especificado',
  NOT_MENTIONED.value,
]);

export function isActionable(value: string): boolean {
  return !NON_ACTIONABLE_VALUES.has(value);
}

/** Valores aceptados como filtro de una dimensión. */
export function filterValues(key: DimensionKey): string[] {
  return displayOptions(key).map((o) => o.value);
}
