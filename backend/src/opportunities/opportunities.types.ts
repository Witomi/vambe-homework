import { DimensionKey } from '../domain/categories';

/** Contrato de respuesta de `GET /api/opportunities`. */

/** Un grupo de clientes (p. ej. industria = Salud) y su conversión. */
export interface Segment {
  dimension: DimensionKey;
  dimensionLabel: string;
  value: string;
  label: string;
  count: number;
  closeRate: number;
}

export type QuadrantKey = 'protect' | 'grow' | 'fix' | 'deprioritize';

/** Cuadrante del mapa volumen × conversión, con la acción sugerida. */
export interface Quadrant {
  key: QuadrantKey;
  title: string;
  action: string;
  segments: Segment[];
}

/** Combinación de necesidades que se repite en varias industrias. */
export interface ReplicableSolution {
  /** Casos de uso que definen la solución (p. ej. agendamiento + recordatorios). */
  useCases: { value: string; label: string }[];
  /** Integración más pedida por esos clientes, si alguna destaca. */
  topIntegration: { value: string; label: string } | null;
  clients: number;
  industries: { value: string; label: string }[];
  closeRate: number;
  monthlyInquiries: number;
}

/** Lead perdido que se parece a los que sí cierran. */
export interface RecoverableLead {
  id: string;
  name: string;
  seller: string;
  industry: string;
  monthlyInquiries: number;
  /** Probabilidad estimada de cierre (0..1). */
  winScore: number;
  /** Nota A–D según esa probabilidad. */
  grade: string;
  /** Rasgos del perfil que más suben su probabilidad. */
  reasons: string[];
}

export interface LeadRecovery {
  /** Cuántos leads perdidos tienen un perfil sobre el promedio. */
  candidates: number;
  /** Consultas mensuales de esos leads (proxy del valor en juego). */
  monthlyInquiries: number;
  /** Los de mayor volumen, para empezar por ahí. */
  top: RecoverableLead[];
}

/** Vendedor recomendado para los leads de una industria. */
export interface SellerAssignment {
  industry: { value: string; label: string };
  seller: string;
  sellerRate: number;
  sellerMeetings: number;
  industryRate: number;
}

/** Rasgo que baja la conversión, con la acción sugerida para resolverlo. */
export interface Blocker extends Segment {
  action: string;
}

export interface OpportunitiesResponse {
  baseRate: number | null;
  categorized: number;
  quadrants: Quadrant[];
  solutions: ReplicableSolution[];
  recovery: LeadRecovery;
  assignments: SellerAssignment[];
  blockers: Blocker[];
}
