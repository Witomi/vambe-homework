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

/** Rasgo con el que, dentro de un grupo, se cierra más que el grupo. */
const winningTraitSchema = segmentSchema.extend({ groupRate: rate });

const segmentWithTraitsSchema = segmentSchema.extend({
  winningTraits: z.array(winningTraitSchema),
});

export const opportunitiesSchema = z.object({
  baseRate: rate.nullable(),
  /** Umbrales con los que se calcularon las secciones. */
  rules: z.object({
    neutralBandPts: z.number(),
    minAdvantagePts: z.number(),
    minSellerMeetings: z.number().int(),
    minSolutionIndustries: z.number().int(),
  }),
  categorized: z.number().int(),
  quadrants: z.array(
    z.object({
      key: z.enum(['protect', 'grow', 'fix', 'deprioritize']),
      title: z.string(),
      description: z.string(),
      segments: z.array(segmentWithTraitsSchema),
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
        suggestedSeller: z
          .object({ seller: z.string(), gainPts: z.number() })
          .nullable(),
        industry: z.string(),
        monthlyInquiries: z.number(),
        winScore: rate,
        grade: gradeSchema,
        reasons: z.array(
          z.object({ label: z.string(), oddsRatio: z.number() }),
        ),
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
  blockers: z.array(segmentWithTraitsSchema),
});
