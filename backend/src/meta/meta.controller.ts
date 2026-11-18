import { Controller, Get } from '@nestjs/common';
import { MetaService } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  /** Taxonomía, opciones de filtro y estado de la categorización. */
  @Get()
  get() {
    return this.metaService.get();
  }
}
