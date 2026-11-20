import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataModule } from '../data/data.module';
import { BatchCategorizer } from './batch-categorizer';
import { CategorizationService } from './categorization.service';
import { LLM_PROVIDER } from './llm/llm-provider';
import { createLlmProvider } from './llm/create-llm-provider';

@Module({
  imports: [DataModule],
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: createLlmProvider,
    },
    BatchCategorizer,
    CategorizationService,
  ],
  exports: [CategorizationService],
})
export class CategorizationModule {}
