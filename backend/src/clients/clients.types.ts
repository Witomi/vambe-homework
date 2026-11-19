import { Client } from '../domain/client';
import { ClientPrediction } from '../prediction/prediction.types';

/** Contratos de respuesta de `GET /api/clients` y `GET /api/clients/:id`. */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Probabilidad de cierre y nota A–D; null si el cliente no está categorizado. */
interface WithPrediction {
  prediction: ClientPrediction | null;
}

/** En el listado se envía un extracto; la transcripción completa va en el detalle. */
export type ClientListItem = Omit<Client, 'transcript'> &
  WithPrediction & { excerpt: string };

export type ClientDetail = Client & WithPrediction;
