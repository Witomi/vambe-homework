import { getJson } from './http';
import {
  clientDetailSchema,
  clientsPageSchema,
  metaSchema,
  metricsSchema,
  opportunitiesSchema,
  predictionSchema,
} from './schemas';

export { ApiError } from './http';

/** Cliente tipado del backend. Todas las respuestas se validan con Zod. */
export const api = {
  meta: () => getJson('/meta', metaSchema),
  metrics: (query: URLSearchParams) =>
    getJson('/metrics', metricsSchema, query),
  opportunities: () => getJson('/opportunities', opportunitiesSchema),
  prediction: () => getJson('/prediction', predictionSchema),
  clients: (query: URLSearchParams) =>
    getJson('/clients', clientsPageSchema, query),
  client: (id: string) =>
    getJson(`/clients/${encodeURIComponent(id)}`, clientDetailSchema),
};
