import { Controller, Get } from '@nestjs/common';
import { MetaService } from './meta.service';
import type { MetaResponse } from './meta.types';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  /** Taxonomía, opciones de filtro y estado de la categorización. */
  @Get()
  get(): MetaResponse {
    return this.metaService.get();
  }
}
