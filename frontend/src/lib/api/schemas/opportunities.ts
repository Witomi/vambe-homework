import { z } from 'zod';
import { dimensionKeySchema, gradeSchema, optionSchema, rate } from './shared';

/** Respuesta de `GET /api/opportunities`. */

const segmentSchema = z.object({
  dimension: dimensionKeySchema,
  dimensionLabel: z.string(),
  value: z.string(),
  label: z.string(),
  count: z.number().int(),
  closeRate: rate,
});

export const opportunitiesSchema = z.object({
  baseRate: rate.nullable(),
  categorized: z.number().int(),
  quadrants: z.array(
    z.object({
      key: z.enum(['protect', 'grow', 'fix', 'deprioritize']),
      title: z.string(),
      action: z.string(),
      segments: z.array(segmentSchema),
    }),
  ),
  solutions: z.array(
    z.object({
      useCases: z.array(optionSchema),
      topIntegration: optionSchema.nullable(),
      clients: z.number().int(),
      industries: z.array(optionSchema),
      closeRate: rate,
      monthlyInquiries: z.number(),
    }),
  ),
  recovery: z.object({
    candidates: z.number().int(),
    monthlyInquiries: z.number(),
    top: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        seller: z.string(),
        industry: z.string(),
        monthlyInquiries: z.number(),
        winScore: rate,
        grade: gradeSchema,
        reasons: z.array(z.string()),
      }),
    ),
  }),
  assignments: z.array(
    z.object({
      industry: optionSchema,
      seller: z.string(),
      sellerRate: rate,
      sellerMeetings: z.number().int(),
      industryRate: rate,
    }),
  ),
  blockers: z.array(segmentSchema.extend({ action: z.string() })),
});
