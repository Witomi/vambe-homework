/** Tipos de la API del backend (`/api`). */

export interface Option {
  value: string;
  label: string;
}

export interface Dimension {
  key: DimensionKey;
  label: string;
  description: string;
  multi: boolean;
  options: Option[];
}

export type DimensionKey =
  | 'industry'
  | 'businessSize'
  | 'leadSource'
  | 'inquiryChannel'
  | 'painPoint'
  | 'useCases'
  | 'integrations'
  | 'requirements'
  | 'objections'
  | 'urgency'
  | 'complexity';

export interface Meta {
  dimensions: Dimension[];
  volumeBuckets: Option[];
  sellers: string[];
  dateRange: { from: string | null; to: string | null };
  categorization: { total: number; categorized: number; models: string[] };
}

export type Categories = Record<DimensionKey, string | string[]> & {
  monthlyInquiries: number | null;
  summary: string;
};

export interface ClientBase {
  id: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  meetingDate: string;
  closed: boolean;
  categories: Categories | null;
}

export interface ClientListItem extends ClientBase {
  excerpt: string;
}

export interface ClientDetail extends ClientBase {
  transcript: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RateStat {
  count: number;
  closed: number;
  closeRate: number | null;
}

export interface BreakdownRow extends RateStat {
  value: string;
  label: string;
  share: number;
}

export interface Insight {
  id: string;
  tone: 'positive' | 'negative' | 'neutral';
  title: string;
  detail: string;
  filter?: { key: string; value: string };
}

export interface Metrics {
  kpis: {
    meetings: number;
    closed: number;
    closeRate: number | null;
    categorized: number;
    coverage: number;
    categorizedCloseRate: number | null;
    medianMonthlyInquiries: number | null;
    automatedMonthlyInquiries: number;
  };
  timeline: (RateStat & { month: string })[];
  sellers: (RateStat & { seller: string })[];
  dimensions: Record<DimensionKey, BreakdownRow[]>;
  volume: BreakdownRow[];
  sellerIndustry: {
    sellers: string[];
    industries: Option[];
    cells: (RateStat & { seller: string; industry: string })[];
  };
  insights: Insight[];
}
