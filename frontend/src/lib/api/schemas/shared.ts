import { z } from 'zod';

/** Piezas compartidas por los esquemas de varios endpoints. */

export const DIMENSION_KEYS = [
  'industry',
  'businessSize',
  'leadSource',
  'inquiryChannel',
  'painPoint',
  'useCases',
  'integrations',
  'requirements',
  'objections',
  'urgency',
  'complexity',
  'seasonality',
] as const;

export const dimensionKeySchema = z.enum(DIMENSION_KEYS);

export const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

/** Una tasa o proporción entre 0 y 1. */
export const rate = z.number().min(0).max(1);

export const gradeSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F']);
