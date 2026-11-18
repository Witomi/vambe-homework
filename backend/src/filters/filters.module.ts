import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ClientFilterService } from './client-filter.service';

@Module({
  imports: [DataModule],
  providers: [ClientFilterService],
  exports: [ClientFilterService],
})
export class FiltersModule {}
