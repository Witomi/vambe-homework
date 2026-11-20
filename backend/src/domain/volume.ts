/**
 * Desde cuántas consultas al mes un cliente es de volumen "muy alto" (≈170
 * al día). Es el mismo umbral del dolor "volumen alto" (ver `derived-rules.ts`).
 */
export const HIGH_VOLUME_MONTHLY = 5000;

/** Rangos de volumen mensual de consultas, usados para segmentar y filtrar. */
export const VOLUME_BUCKETS = [
  { value: 'bajo', label: '< 200 / mes', max: 200 },
  { value: 'medio', label: '200 – 1.000 / mes', max: 1000 },
  { value: 'alto', label: '1.000 – 5.000 / mes', max: HIGH_VOLUME_MONTHLY },
  { value: 'muy_alto', label: '> 5.000 / mes', max: Infinity },
] as const;

export type VolumeBucket = (typeof VOLUME_BUCKETS)[number]['value'];

export function volumeBucket(monthly: number | null): VolumeBucket | null {
  if (monthly === null) return null;
  return VOLUME_BUCKETS.find((b) => monthly < b.max)!.value;
}
