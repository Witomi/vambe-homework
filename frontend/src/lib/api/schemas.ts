import { z } from 'zod';

/**
 * Esquemas de las respuestas del backend.
 *
 * Son el contrato del frontend con la API: cada respuesta se valida al
 * llegar, así un cambio incompatible en el backend falla con un error
 * claro en vez de propagarse como `undefined` hasta un gráfico.
 * Los tipos de TypeScript se derivan de aquí (`z.infer`), sin duplicarlos.
 */

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
] as const;

export const dimensionKeySchema = z.enum(DIMENSION_KEYS);

export const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const rate = z.number().min(0).max(1);

// ---------- /api/meta ----------

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

// ---------- /api/clients ----------

/** Categorías extraídas por el LLM: dimensiones simples (string) y múltiples (string[]). */
export const categoriesSchema = z.object({
  industry: z.string(),
  businessSize: z.string(),
  leadSource: z.string(),
  inquiryChannel: z.string(),
  painPoint: z.string(),
  urgency: z.string(),
  complexity: z.string(),
  useCases: z.array(z.string()),
  integrations: z.array(z.string()),
  requirements: z.array(z.string()),
  objections: z.array(z.string()),
  monthlyInquiries: z.number().nullable(),
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

// ---------- /api/metrics ----------

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
  tone: z.enum(['positive', 'negative', 'neutral']),
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
  sellers: z.array(rateStatSchema.extend({ seller: z.string() })),
  dimensions: z.record(dimensionKeySchema, z.array(breakdownRowSchema)),
  volume: z.array(breakdownRowSchema),
  sellerIndustry: z.object({
    sellers: z.array(z.string()),
    industries: z.array(optionSchema),
    cells: z.array(
      rateStatSchema.extend({ seller: z.string(), industry: z.string() }),
    ),
  }),
  insights: z.array(insightSchema),
});
