import { Controller, Get, Param, Query } from '@nestjs/common';
import { ClientsQueryDto } from './clients-query.dto';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  list(@Query() query: ClientsQueryDto) {
    return this.clientsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }
}
