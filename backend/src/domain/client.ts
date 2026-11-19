import { Categories } from './categories';

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

/**
 * Cliente que ya fue categorizado por el LLM. Las funciones de análisis
 * reciben este tipo, así no necesitan comprobar (ni asumir) que
 * `categories` no es null.
 */
export interface CategorizedClient extends Client {
  categories: Categories;
}

export function isCategorized(client: Client): client is CategorizedClient {
  return client.categories !== null;
}
