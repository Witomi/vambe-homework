import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VOLUME_BUCKETS, optionValues } from '../domain/taxonomy';
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

  @DimensionFilter(VOLUME_BUCKETS.map((b) => b.value))
  volume?: string[];

  @DimensionFilter(optionValues('industry'))
  industry?: string[];

  @DimensionFilter(optionValues('businessSize'))
  businessSize?: string[];

  @DimensionFilter(optionValues('leadSource'))
  leadSource?: string[];

  @DimensionFilter(optionValues('inquiryChannel'))
  inquiryChannel?: string[];

  @DimensionFilter(optionValues('painPoint'))
  painPoint?: string[];

  @DimensionFilter(optionValues('useCases'))
  useCases?: string[];

  @DimensionFilter(optionValues('integrations'))
  integrations?: string[];

  @DimensionFilter(optionValues('requirements'))
  requirements?: string[];

  @DimensionFilter(optionValues('objections'))
  objections?: string[];

  @DimensionFilter(optionValues('urgency'))
  urgency?: string[];

  @DimensionFilter(optionValues('complexity'))
  complexity?: string[];
}
