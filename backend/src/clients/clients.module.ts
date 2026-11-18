import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [DataModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
