import { z } from 'zod';
import { dimensionKeySchema, optionSchema } from './shared';

/** Respuesta de `GET /api/meta`. */

export const dimensionSchema = z.object({
  key: dimensionKeySchema,
  label: z.string(),
  description: z.string(),
  multi: z.boolean(),
  options: z.array(optionSchema),
});

export const metaSchema = z.object({
  dimensions: z.array(dimensionSchema),
  volumeBuckets: z.array(optionSchema),
  /** Notas A–F para filtrar por probabilidad de cierre. */
  grades: z.array(optionSchema),
  /** Valor de "no mencionó nada" en dimensiones de lista. */
  notMentioned: optionSchema,
  sellers: z.array(z.string()),
  dateRange: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  categorization: z.object({
    total: z.number().int(),
    categorized: z.number().int(),
    models: z.array(z.string()),
  }),
});
