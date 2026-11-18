import type {
  ClientDetail,
  ClientListItem,
  Meta,
  Metrics,
  Paginated,
} from './types';

/**
 * En el servidor se prefiere `API_URL` (red interna en producción);
 * en el navegador solo existe `NEXT_PUBLIC_API_URL`.
 */
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(`API ${res.status} en ${path}`, res.status);
  }
  return res.json() as Promise<T>;
}

const withQuery = (path: string, query: URLSearchParams) =>
  query.size ? `${path}?${query}` : path;

export const api = {
  meta: () => apiFetch<Meta>('/meta'),
  metrics: (query: URLSearchParams) =>
    apiFetch<Metrics>(withQuery('/metrics', query)),
  clients: (query: URLSearchParams) =>
    apiFetch<Paginated<ClientListItem>>(withQuery('/clients', query)),
  client: (id: string) =>
    apiFetch<ClientDetail>(`/clients/${encodeURIComponent(id)}`),
};
