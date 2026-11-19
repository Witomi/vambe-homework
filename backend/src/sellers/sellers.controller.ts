import { Controller, Get } from '@nestjs/common';
import { SellersService } from './sellers.service';
import type { SellersResponse } from './sellers.types';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  compute(): SellersResponse {
    return this.sellersService.compute();
  }
}
