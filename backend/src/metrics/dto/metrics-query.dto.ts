import { IsOptional, Matches } from 'class-validator';
import { ClientFilterDto } from '../../filters/client-filter.dto';

/** Valor de `period` que pide las cifras de todo el período, sin comparar meses. */
export const HISTORIC_PERIOD = 'historico';

/** Filtros + el mes a revisar en las cifras clave del panel. */
export class MetricsQueryDto extends ClientFilterDto {
  /**
   * `YYYY-MM` para revisar ese mes, `historico` para todo el período.
   * Sin valor: el último mes con reuniones en el segmento.
   */
  @IsOptional()
  @Matches(/^(historico|\d{4}-(0[1-9]|1[0-2]))$/, {
    message: 'period debe ser YYYY-MM o "historico"',
  })
  period?: string;
}
