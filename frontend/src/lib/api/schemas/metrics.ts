import { z } from 'zod';
import { dimensionKeySchema, rate } from './shared';

/** Respuesta de `GET /api/metrics`. */

const rateStatSchema = z.object({
  count: z.number().int(),
  closed: z.number().int(),
  closeRate: rate.nullable(),
});

export const breakdownRowSchema = rateStatSchema.extend({
  value: z.string(),
  label: z.string(),
  share: rate,
});

export const insightSchema = z.object({
  id: z.string(),
  tone: z.enum(['positive', 'negative']),
  title: z.string(),
  detail: z.string(),
  filter: z.object({ key: z.string(), value: z.string() }).optional(),
});

export const metricsSchema = z.object({
  kpis: z.object({
    meetings: z.number().int(),
    closed: z.number().int(),
    closeRate: rate.nullable(),
    categorized: z.number().int(),
    coverage: rate,
    categorizedCloseRate: rate.nullable(),
    medianMonthlyInquiries: z.number().nullable(),
    automatedMonthlyInquiries: z.number(),
  }),
  timeline: z.array(rateStatSchema.extend({ month: z.string() })),
  sellers: z.array(
    z.object({
      seller: z.string(),
      count: z.number().int(),
      closed: z.number().int(),
      closeRate: rate,
      expectedRate: rate,
    }),
  ),
  dimensions: z.record(dimensionKeySchema, z.array(breakdownRowSchema)),
  insights: z.array(insightSchema),
});
