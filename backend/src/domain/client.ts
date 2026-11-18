import { Categories } from './taxonomy';

/** Fila del CSV, ya tipada y normalizada. */
export interface RawClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  seller: string;
  /** Fecha ISO `YYYY-MM-DD`. */
  meetingDate: string;
  closed: boolean;
  transcript: string;
}

export interface CategorizationRecord {
  categories: Categories;
  model: string;
  categorizedAt: string;
}

/** Cliente enriquecido con la categorización del LLM (si existe). */
export interface Client extends RawClient {
  categories: Categories | null;
}
