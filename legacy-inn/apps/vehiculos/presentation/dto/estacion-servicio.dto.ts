import {
  OptionalInteger,
  OptionalNumber,
  OptionalText,
  RequiredText,
} from '@common/presentation/decorators';
import { PartialType, OmitType } from '@nestjs/swagger';

export class CreateEstacionServicioDto {
  @RequiredText({ maxLength: 150 })
  nombre: string;

  @RequiredText({ maxLength: 100 })
  direccion: string;

  @OptionalText({ maxLength: 200 })
  observaciones?: string;

  @OptionalInteger({ min: 1 })
  municipioId?: number;

  @OptionalNumber({ min: -90, max: 90 })
  latitud?: number;

  @OptionalNumber({ min: -180, max: 180 })
  longitud?: number;
}

export class UpdateEstacionServicioDto extends PartialType(
  OmitType(CreateEstacionServicioDto, [] as const)
) {}
