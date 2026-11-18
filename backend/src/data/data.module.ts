import { Module } from '@nestjs/common';
import { CategorizationStore } from './categorization.store';
import { ClientsRepository } from './clients.repository';

@Module({
  providers: [CategorizationStore, ClientsRepository],
  exports: [CategorizationStore, ClientsRepository],
})
export class DataModule {}
