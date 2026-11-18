import { Client } from '../domain/client';

/** Contratos de respuesta de `GET /api/clients` y `GET /api/clients/:id`. */

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** En el listado se envía un extracto; la transcripción completa va en el detalle. */
export type ClientListItem = Omit<Client, 'transcript'> & { excerpt: string };

export type ClientDetail = Client;
