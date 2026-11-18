import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  DATA_DIR: z.string().default('data'),
  CLIENTS_CSV: z.string().default('clients.csv'),
  CATEGORIZATIONS_FILE: z.string().default('categorizations.json'),

  GEMINI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gemma-4-26b-a4b-it'),
  LLM_FALLBACK_MODEL: z.string().default('gemma-4-31b-it'),
  LLM_THINKING_LEVEL: z.enum(['minimal', 'default']).default('minimal'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(180_000),
  /** Máximo de requests por minuto al LLM (free tier de Gemma ≈ 30). */
  LLM_RPM: z.coerce.number().int().positive().default(25),
  LLM_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.1),
});

export type Env = z.infer<typeof envSchema>;

/** Valida las variables de entorno al arrancar; falla rápido si hay errores. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Variables de entorno inválidas:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
