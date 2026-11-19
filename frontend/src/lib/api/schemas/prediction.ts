import { z } from 'zod';
import { gradeSchema, rate } from './shared';

/** Respuesta de `GET /api/prediction`. */

const factorSchema = z.object({
  label: z.string(),
  weight: z.number(),
  oddsRatio: z.number().positive(),
});

export const predictionSchema = z.object({
  quality: z.object({
    sampleSize: z.number().int(),
    baseRate: rate,
    auc: rate,
    logLoss: z.number(),
    baselineLogLoss: z.number(),
    folds: z.number().int(),
  }),
  grades: z.array(
    z.object({
      grade: gradeSchema,
      title: z.string(),
      range: z.string(),
      action: z.string(),
      count: z.number().int(),
      closed: z.number().int(),
      closeRate: rate.nullable(),
    }),
  ),
  buckets: z.array(
    z.object({
      from: rate,
      to: rate,
      closed: z.number().int(),
      open: z.number().int(),
      meanPredicted: rate,
    }),
  ),
  factors: z.object({
    positive: z.array(factorSchema),
    negative: z.array(factorSchema),
  }),
});
