import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env';
import { DataModule } from '../data/data.module';
import { CategorizationService } from './categorization.service';
import { GemmaProvider } from './llm/gemma.provider';
import { LLM_PROVIDER, LlmProvider } from './llm/llm-provider';

/** Proveedor que falla con un mensaje claro si no hay API key configurada. */
const missingKeyProvider = (model: string): LlmProvider => ({
  model,
  generate: () =>
    Promise.reject(
      new Error('Falta GEMINI_API_KEY en backend/.env para usar el LLM'),
    ),
});

@Module({
  imports: [DataModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LlmProvider => {
        const apiKey = config.get('GEMINI_API_KEY', { infer: true });
        const model = config.get('LLM_MODEL', { infer: true });
        if (!apiKey) return missingKeyProvider(model);
        return new GemmaProvider({
          apiKey,
          model,
          fallbackModel: config.get('LLM_FALLBACK_MODEL', { infer: true }),
          temperature: config.get('LLM_TEMPERATURE', { infer: true }),
          thinkingLevel: config.get('LLM_THINKING_LEVEL', { infer: true }),
          timeoutMs: config.get('LLM_TIMEOUT_MS', { infer: true }),
        });
      },
    },
    CategorizationService,
  ],
  exports: [CategorizationService],
})
export class CategorizationModule {}
