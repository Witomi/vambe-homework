import type { DimensionKey, Meta } from './api/types';

/** Resuelve etiquetas legibles a partir de la taxonomía que expone el backend. */
export function createLabeler(meta: Meta) {
  const map = new Map<string, Map<string, string>>();
  for (const d of meta.dimensions) {
    map.set(d.key, new Map(d.options.map((o) => [o.value, o.label])));
  }
  map.set('volume', new Map(meta.volumeBuckets.map((o) => [o.value, o.label])));

  return {
    dimension: (key: DimensionKey | string) =>
      meta.dimensions.find((d) => d.key === key)?.label ?? key,
    value: (key: string, value: string) => map.get(key)?.get(value) ?? value,
  };
}

export type Labeler = ReturnType<typeof createLabeler>;
