import { z } from 'zod';
import { gradeSchema, rate } from './shared';

/** Respuestas de `GET /api/clients` y `GET /api/clients/:id`. */

/** Categorías extraídas por el LLM: dimensiones simples (string) y múltiples (string[]). */
export const categoriesSchema = z.object({
  industry: z.string(),
  businessSize: z.string(),
  leadSource: z.string(),
  inquiryChannel: z.string(),
  painPoint: z.string(),
  urgency: z.string(),
  complexity: z.string(),
  seasonality: z.string(),
  useCases: z.array(z.string()),
  integrations: z.array(z.string()),
  requirements: z.array(z.string()),
  objections: z.array(z.string()),
  monthlyInquiries: z.number().nullable(),
  peakMonthlyInquiries: z.number().nullable(),
  summary: z.string(),
});

const clientBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  seller: z.string(),
  meetingDate: z.string(),
  closed: z.boolean(),
  categories: categoriesSchema.nullable(),
  /** Probabilidad de cierre y nota; null si no está categorizado. */
  prediction: z.object({ probability: rate, grade: gradeSchema }).nullable(),
});

export const clientListItemSchema = clientBaseSchema.extend({
  excerpt: z.string(),
});

export const clientDetailSchema = clientBaseSchema.extend({
  transcript: z.string(),
});

export const clientsPageSchema = z.object({
  items: z.array(clientListItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
});
