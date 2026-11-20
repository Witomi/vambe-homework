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

const kpisSchema = z.object({
  meetings: z.number().int(),
  closed: z.number().int(),
  closeRate: rate.nullable(),
  categorized: z.number().int(),
  coverage: rate,
  categorizedCloseRate: rate.nullable(),
  medianMonthlyInquiries: z.number().nullable(),
  automatedMonthlyInquiries: z.number(),
  estimatedAutomatedMonthlyInquiries: z.number().nullable(),
});

const monthKpisSchema = kpisSchema.extend({ month: z.string() });

export const metricsSchema = z.object({
  /** Todo el período filtrado. */
  kpis: kpisSchema,
  /** Mes revisado vs. mes anterior y mismo mes del año pasado; null en modo histórico. */
  monthComparison: z
    .object({
      current: monthKpisSchema,
      previousMonth: monthKpisSchema,
      sameMonthLastYear: monthKpisSchema,
    })
    .nullable(),
  timeline: z.array(
    rateStatSchema.extend({
      month: z.string(),
      estimatedNewAutomatedInquiries: z.number().nullable(),
    }),
  ),
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
