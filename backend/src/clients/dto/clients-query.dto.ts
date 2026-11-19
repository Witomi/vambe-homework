import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ClientFilterDto } from '../../filters/client-filter.dto';

export const SORT_FIELDS = [
  'meetingDate',
  'name',
  'seller',
  'closed',
  'monthlyInquiries',
  'probability',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

/** Filtros + paginación y orden del listado de clientes. */
export class ClientsQueryDto extends ClientFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy: SortField = 'meetingDate';

  @IsOptional()
  @IsIn(SORT_DIRECTIONS)
  sortDir: SortDirection = 'desc';
}
