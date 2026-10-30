import {
  OptionalInteger,
  OptionalText,
  RequiredInteger,
  RequiredText,
} from '@common/presentation/decorators';
import { PaginationDto } from '@common/presentation/dto';

export class AjustarOdometroDto {
  @RequiredInteger({ min: 1 })
  activoId: number;

  @RequiredInteger({ min: 0 })
  lectura: number;

  @RequiredText()
  fechaLectura: string;

  @RequiredText({ maxLength: 500 })
  observacion: string;

  @OptionalInteger({ min: 1 })
  referenciaId?: number;
}

export class FilterIntentoDto extends PaginationDto {}

export class ResolverIntentoDto {
  @RequiredInteger({ min: 1 })
  tanqueoId: number;
}

export class LimpiarIntentosPendientesDto {
  @OptionalText({ maxLength: 500 })
  observacion?: string;
}
