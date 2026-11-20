import type { Dimension, DimensionKey, Meta } from './api/types';

/** Definición de una dimensión (etiqueta, opciones…) desde la taxonomía. */
export function findDimension(meta: Meta, key: DimensionKey): Dimension {
  const dimension = meta.dimensions.find((dimension) => dimension.key === key);
  if (!dimension) throw new Error(`Dimensión desconocida: ${key}`);
  return dimension;
}

/** Resuelve etiquetas legibles a partir de la taxonomía que expone el backend. */
export function createLabeler(meta: Meta) {
  const map = new Map<string, Map<string, string>>();
  for (const dimension of meta.dimensions) {
    map.set(
      dimension.key,
      new Map(dimension.options.map((option) => [option.value, option.label])),
    );
  }
  map.set(
    'volume',
    new Map(meta.volumeBuckets.map((option) => [option.value, option.label])),
  );
  map.set(
    'grade',
    new Map(meta.grades.map((option) => [option.value, option.label])),
  );

  return {
    dimension: (key: string) =>
      meta.dimensions.find((dimension) => dimension.key === key)?.label ?? key,
    value: (key: string, value: string) => map.get(key)?.get(value) ?? value,
  };
}

export type Labeler = ReturnType<typeof createLabeler>;
