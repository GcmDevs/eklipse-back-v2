import {
  OptionalBoolean,
  OptionalEnum,
  OptionalInteger,
  OptionalNumber,
  OptionalText,
  RequiredEnum,
  RequiredInteger,
  RequiredText,
} from '@common/presentation/decorators';
import { FilterSearchPaginatedDto, PaginationDto } from '@common/presentation/dto';
import { PartialType, OmitType } from '@nestjs/swagger';
import {
  ClasificacionUso,
  EstadoVehiculo,
  TipoActivo,
  TipoCombustible,
  UnidadMedidaCombustible,
} from 'apps/vehiculos/domain/enums';

export class CreateVehiculoDto {
  @RequiredText({ maxLength: 10 })
  placa: string;

  @RequiredInteger({ min: 1 })
  modeloId: number;

  @OptionalEnum(EstadoVehiculo)
  estado?: EstadoVehiculo;

  @RequiredEnum(TipoActivo)
  tipoActivo: TipoActivo;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @OptionalNumber({ min: 0 })
  capacidadAlmacenamientoCombustible?: number;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCapacidad: UnidadMedidaCombustible;

  @OptionalInteger({ min: 1900 })
  anioModelo?: number;

  @OptionalEnum(ClasificacionUso)
  clasificacionUso?: ClasificacionUso;

  @OptionalInteger({ min: 0 })
  kilometrajeActual?: number;
}

export class UpdateVehiculoDto extends PartialType(
  OmitType(CreateVehiculoDto, ['placa', 'kilometrajeActual'] as const)
) {}

export class FilterVehiculoDto extends FilterSearchPaginatedDto {
  @OptionalEnum(EstadoVehiculo)
  estado?: EstadoVehiculo;

  @OptionalEnum(TipoActivo)
  tipoActivo?: TipoActivo;
}

export class FilterEstacionServicioDto extends PaginationDto {
  @OptionalInteger({ min: 1 })
  municipioId?: number;

  @OptionalBoolean()
  activa?: boolean;

  @OptionalText()
  search?: string;
}
