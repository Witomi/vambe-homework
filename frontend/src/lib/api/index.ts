import { getJson } from './http';
import {
  clientDetailSchema,
  clientsPageSchema,
  metaSchema,
  metricsSchema,
} from './schemas';

export { ApiError } from './http';

/** Cliente tipado del backend. Todas las respuestas se validan con Zod. */
export const api = {
  meta: () => getJson('/meta', metaSchema),
  metrics: (query: URLSearchParams) =>
    getJson('/metrics', metricsSchema, query),
  clients: (query: URLSearchParams) =>
    getJson('/clients', clientsPageSchema, query),
  client: (id: string) =>
    getJson(`/clients/${encodeURIComponent(id)}`, clientDetailSchema),
};
