import type { z } from 'zod';

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

/** GET a la API, validando la respuesta contra `schema`. */
export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  query?: URLSearchParams,
): Promise<T> {
  const url = `${API_URL}${path}${query?.size ? `?${query}` : ''}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new ApiError(`API respondió ${res.status} en ${path}`, res.status);
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    throw new Error(
      `Respuesta inesperada de ${path}: ${parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  return parsed.data;
}
