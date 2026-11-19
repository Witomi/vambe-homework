import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  imports: [DataModule],
  controllers: [SellersController],
  providers: [SellersService],
})
export class SellersModule {}
