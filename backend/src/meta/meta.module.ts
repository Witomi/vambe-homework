import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Module({
  imports: [DataModule],
  controllers: [MetaController],
  providers: [MetaService],
})
export class MetaModule {}
