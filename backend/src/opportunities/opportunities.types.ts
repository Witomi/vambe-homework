import { WinningTrait } from '../analytics/winning-traits';
import { DimensionKey } from '../domain/categories';
import { SellerSuggestion } from '../prediction/prediction.types';

export type { WinningTrait };

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

/** Un grupo con los rasgos de los que, dentro de él, sí cerraron. */
export interface SegmentWithTraits extends Segment {
  winningTraits: WinningTrait[];
}

export type QuadrantKey = 'protect' | 'grow' | 'fix' | 'deprioritize';

/** Cuadrante del mapa volumen × conversión: nombre y regla salen de los datos. */
export interface Quadrant {
  key: QuadrantKey;
  title: string;
  /** Qué tienen en común sus grupos, con las cifras del corte. */
  description: string;
  segments: SegmentWithTraits[];
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
/** Un rasgo del lead que sube su probabilidad de cierre. */
export interface LeadReason {
  /** "Industria: E-commerce", "Consultas/mes (más volumen)"… */
  label: string;
  /** Cuántas veces multiplica las chances de cierre. */
  oddsRatio: number;
}

export interface RecoverableLead {
  id: string;
  name: string;
  /** Vendedor que atendió la reunión original. */
  seller: string;
  /** Vendedor con el que el modelo estima más probabilidad, si no es el original. */
  suggestedSeller: SellerSuggestion | null;
  industry: string;
  monthlyInquiries: number;
  /** Probabilidad estimada de cierre (0..1). */
  winScore: number;
  /** Nota A–F según esa probabilidad. */
  grade: string;
  /** Rasgos del perfil que más suben su probabilidad. */
  reasons: LeadReason[];
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

/** Rasgo que baja la conversión, con lo que tenían los que cerraron igual. */
export type Blocker = SegmentWithTraits;

/**
 * Umbrales con los que se calcularon las secciones. Se envían para que la
 * interfaz los explique sin repetirlos (y sin quedar desactualizada).
 */
export interface OpportunityRules {
  /** El mapa omite los grupos a menos de esto del promedio. */
  neutralBandPts: number;
  /** Ventaja mínima de un vendedor sobre el equipo para recomendarlo. */
  minAdvantagePts: number;
  /** Reuniones mínimas de un vendedor en el rubro. */
  minSellerMeetings: number;
  /** Industrias distintas para que una solución cuente como replicable. */
  minSolutionIndustries: number;
}

export interface OpportunitiesResponse {
  baseRate: number | null;
  rules: OpportunityRules;
  categorized: number;
  quadrants: Quadrant[];
  solutions: ReplicableSolution[];
  recovery: LeadRecovery;
  assignments: SellerAssignment[];
  blockers: Blocker[];
}
