import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VOLUME_BUCKETS, filterValues } from '../domain/categories';
import { GRADE_VALUES } from '../domain/grades';
import { toBoolean, toList } from './query-transforms';

/** Decorador para filtros de dimensión: lista de valores permitidos. */
function DimensionFilter(values: string[]): PropertyDecorator {
  return (target, key) => {
    IsOptional()(target, key);
    Transform(toList)(target, key);
    IsIn(values, { each: true })(target, key);
  };
}

/**
 * Filtros comunes a la lista de clientes y a las métricas: así el panel y la
 * tabla siempre muestran exactamente el mismo segmento.
 * Dentro de una dimensión los valores se combinan con OR; entre dimensiones, con AND.
 */
export class ClientFilterDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @Transform(toList)
  @IsString({ each: true })
  sellers?: string[];

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  closed?: boolean;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  categorized?: boolean;

  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;

  /** Nota A–F según la probabilidad de cierre estimada. */
  @DimensionFilter([...GRADE_VALUES])
  grade?: string[];

  @DimensionFilter(VOLUME_BUCKETS.map((b) => b.value))
  volume?: string[];

  @DimensionFilter(filterValues('industry'))
  industry?: string[];

  @DimensionFilter(filterValues('businessSize'))
  businessSize?: string[];

  @DimensionFilter(filterValues('leadSource'))
  leadSource?: string[];

  @DimensionFilter(filterValues('inquiryChannel'))
  inquiryChannel?: string[];

  @DimensionFilter(filterValues('painPoint'))
  painPoint?: string[];

  @DimensionFilter(filterValues('useCases'))
  useCases?: string[];

  @DimensionFilter(filterValues('integrations'))
  integrations?: string[];

  @DimensionFilter(filterValues('requirements'))
  requirements?: string[];

  @DimensionFilter(filterValues('objections'))
  objections?: string[];

  @DimensionFilter(filterValues('urgency'))
  urgency?: string[];

  @DimensionFilter(filterValues('complexity'))
  complexity?: string[];

  @DimensionFilter(filterValues('seasonality'))
  seasonality?: string[];
}
