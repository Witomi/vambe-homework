import { ConfigService } from '@nestjs/config';
import { Env } from '../../config/env';
import { GemmaProvider } from './gemma.provider';
import { LlmProvider } from './llm-provider';
import { RateLimitedLlmProvider } from './rate-limited.provider';

/** Proveedor que falla con un mensaje claro si no hay API key configurada. */
function missingKeyProvider(model: string): LlmProvider {
  return {
    model,
    generate: () =>
      Promise.reject(
        new Error('Falta GEMINI_API_KEY en backend/.env para usar el LLM'),
      ),
  };
}

/**
 * Arma el proveedor LLM a partir de la configuración:
 * Gemma (con modelo de respaldo) envuelto en el control de cuota.
 */
export function createLlmProvider(
  config: ConfigService<Env, true>,
): LlmProvider {
  const apiKey = config.get('GEMINI_API_KEY', { infer: true });
  const model = config.get('LLM_MODEL', { infer: true });
  if (!apiKey) return missingKeyProvider(model);

  const gemma = new GemmaProvider({
    apiKey,
    model,
    fallbackModel: config.get('LLM_FALLBACK_MODEL', { infer: true }),
    temperature: config.get('LLM_TEMPERATURE', { infer: true }),
    thinkingLevel: config.get('LLM_THINKING_LEVEL', { infer: true }),
    timeoutMs: config.get('LLM_TIMEOUT_MS', { infer: true }),
  });
  return new RateLimitedLlmProvider(
    gemma,
    config.get('LLM_RPM', { infer: true }),
  );
}
