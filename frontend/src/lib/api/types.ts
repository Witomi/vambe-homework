import type { z } from 'zod';
import type {
  breakdownRowSchema,
  categoriesSchema,
  clientDetailSchema,
  clientListItemSchema,
  clientsPageSchema,
  dimensionKeySchema,
  dimensionSchema,
  gradeSchema,
  insightSchema,
  metaSchema,
  metricsSchema,
  opportunitiesSchema,
  optionSchema,
  predictionSchema,
  sellersSchema,
} from './schemas';

/** Tipos derivados de los esquemas: una sola definición por contrato. */

export type Option = z.infer<typeof optionSchema>;
export type DimensionKey = z.infer<typeof dimensionKeySchema>;
export type Dimension = z.infer<typeof dimensionSchema>;
export type Meta = z.infer<typeof metaSchema>;

export type Categories = z.infer<typeof categoriesSchema>;
export type ClientListItem = z.infer<typeof clientListItemSchema>;
export type ClientDetail = z.infer<typeof clientDetailSchema>;
export type ClientsPage = z.infer<typeof clientsPageSchema>;

export type Metrics = z.infer<typeof metricsSchema>;
export type BreakdownRow = z.infer<typeof breakdownRowSchema>;
export type Insight = z.infer<typeof insightSchema>;

export type Opportunities = z.infer<typeof opportunitiesSchema>;
export type Quadrant = Opportunities['quadrants'][number];
export type Segment = Quadrant['segments'][number];
export type WinningTrait = Segment['winningTraits'][number];
export type OpportunityRules = Opportunities['rules'];

export type Prediction = z.infer<typeof predictionSchema>;
export type Factor = Prediction['factors']['positive'][number];
export type Grade = z.infer<typeof gradeSchema>;

export type Sellers = z.infer<typeof sellersSchema>;
export type SellerSummary = Sellers['sellers'][number];
export type IndustryRow = Sellers['industries'][number];
export type IndustryResult = IndustryRow['team'];
