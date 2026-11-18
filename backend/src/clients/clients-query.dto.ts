import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ClientFilterDto } from '../filters/client-filter.dto';

export const SORT_FIELDS = [
  'meetingDate',
  'name',
  'seller',
  'closed',
  'monthlyInquiries',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

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
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'desc';
}
