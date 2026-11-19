import { z } from 'zod';
import { optionSchema, rate } from './shared';

/** Respuesta de `GET /api/sellers`. */

const industryResultSchema = z.object({
  count: z.number().int(),
  closed: z.number().int(),
  closeRate: rate.nullable(),
});

const highlightSchema = z.object({
  industry: optionSchema,
  closeRate: rate,
  teamRate: rate,
  count: z.number().int(),
});

export const sellersSchema = z.object({
  baseRate: rate.nullable(),
  minSample: z.number().int(),
  sellers: z.array(
    z.object({
      seller: z.string(),
      count: z.number().int(),
      closed: z.number().int(),
      closeRate: rate,
      expectedRate: rate,
      strongest: highlightSchema.nullable(),
      weakest: highlightSchema.nullable(),
    }),
  ),
  industries: z.array(
    z.object({
      industry: optionSchema,
      team: industryResultSchema,
      sellers: z.array(industryResultSchema),
    }),
  ),
});
