import {
  OptionalNested,
  OptionalNumber,
  OptionalText,
  RequiredInteger,
  RequiredNumber,
  RequiredText,
} from '@common/presentation/decorators';
import { PartialType, OmitType } from '@nestjs/swagger';

export class UbicacionEstacionServicioDto {
  @RequiredNumber({ min: -90, max: 90 })
  latitud: number;

  @RequiredNumber({ min: -180, max: 180 })
  longitud: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;
}

export class CreateEstacionServicioDto {
  @RequiredText({ maxLength: 150 })
  nombre: string;

  @RequiredText({ maxLength: 100 })
  direccion: string;

  @OptionalText({ maxLength: 20 })
  nit?: string;

  @OptionalText({ maxLength: 200 })
  observaciones?: string;

  @RequiredInteger({ min: 1 })
  municipioId: number;

  @OptionalNumber({ min: -90, max: 90 })
  latitud?: number;

  @OptionalNumber({ min: -180, max: 180 })
  longitud?: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;

  @OptionalNested(() => UbicacionEstacionServicioDto)
  ubicacion?: UbicacionEstacionServicioDto;
}

export class UpdateEstacionServicioDto extends PartialType(
  OmitType(CreateEstacionServicioDto, [] as const)
) {}
