import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { FiltersModule } from '../filters/filters.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [DataModule, FiltersModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
