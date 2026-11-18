import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import type { ClientDetail, ClientListItem, Paginated } from './clients.types';
import { ClientsQueryDto } from './dto/clients-query.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(@Query() query: ClientsQueryDto): Paginated<ClientListItem> {
    return this.clientsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): ClientDetail {
    return this.clientsService.findOne(id);
  }
}
