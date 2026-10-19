import { PaginationDto } from '@common/presentation/dto';
import {
  OptionalBoolean,
  OptionalDateString,
  OptionalEnum,
  OptionalInteger,
  OptionalNumber,
  OptionalText,
  RequiredBoolean,
  RequiredEnum,
  RequiredInteger,
  RequiredNestedArray,
  RequiredNumber,
  RequiredText,
} from '@common/presentation/decorators';
import {
  TipoCombustible,
  UnidadMedidaCombustible,
  EstadoTanqueo,
  TipoActivo,
  TipoEvidencia,
  OrigenTanqueo,
} from '@vehiculos/domain/enums';
import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import {
  MAX_GALONES_TANQUEO_ESTACION,
  MAX_KILOMETRAJE,
  MAX_VALOR_TANQUEO_ESTACION,
  MIN_VALOR_TANQUEO_ESTACION,
} from '@vehiculos/domain/policies/tanqueo-estacion.policies';

export class EvidenciaItemDto {
  @RequiredEnum(TipoEvidencia)
  tipo: TipoEvidencia;

  @RequiredBoolean()
  omitida: boolean;

  @OptionalInteger({ min: 1 })
  mediaId?: number;

  @OptionalText({ maxLength: 500 })
  motivoOmision?: string;
}

export class CreateTanqueoDto {
  @RequiredInteger({ min: 1 })
  activoId: number;

  @RequiredInteger({ min: 1 })
  repositorioId: number;

  @RequiredNumber({ min: 0.01 })
  cantidadCombustible: number;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible: UnidadMedidaCombustible;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @RequiredText()
  fechaTanqueo: string;

  @OptionalInteger({ min: 1, max: MAX_KILOMETRAJE })
  kilometraje?: number;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string;

  @RequiredNestedArray(() => EvidenciaItemDto)
  evidencias: EvidenciaItemDto[];
}

export class FilterTanqueoDto extends PaginationDto {
  @OptionalInteger({ min: 1 })
  activoId?: number;

  @OptionalInteger({ min: 1 })
  usuarioId?: number;

  @OptionalInteger({ min: 1 })
  estacionServicioId?: number;

  @OptionalEnum(TipoCombustible)
  tipoCombustible?: TipoCombustible;

  @OptionalEnum(EstadoTanqueo)
  estado?: EstadoTanqueo;

  @OptionalEnum(OrigenTanqueo)
  origen?: OrigenTanqueo;

  @OptionalDateString()
  fechaDesde?: string;

  @OptionalDateString()
  fechaHasta?: string;

  @OptionalBoolean()
  tieneAlertas?: boolean;

  @OptionalText({ maxLength: 20 })
  placa?: string;

  @OptionalEnum(TipoActivo)
  tipoActivo?: TipoActivo;
}

export class ChangeEstadoTanqueoDto {
  @OptionalText({ maxLength: 500 })
  motivo?: string;
}

export class TanqueoItemDto {
  @IsUUID()
  @RequiredText({ maxLength: 36 })
  clienteUuid: string;

  @RequiredInteger({ min: 1 })
  activoId: number;

  @OptionalInteger({ min: 1, max: MAX_KILOMETRAJE })
  kilometraje?: number;

  @RequiredNumber({ min: MIN_VALOR_TANQUEO_ESTACION, max: MAX_VALOR_TANQUEO_ESTACION })
  valorTotalPagado: number;

  @RequiredNumber({ min: 0.01, max: MAX_GALONES_TANQUEO_ESTACION })
  cantidadCombustible: number;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible: UnidadMedidaCombustible;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @RequiredInteger({ min: 1 })
  estacionServicioId: number;

  @RequiredText()
  fechaTanqueo: string;

  @OptionalNumber()
  latitud?: number;

  @OptionalNumber()
  longitud?: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string;

  @RequiredText()
  fechaCreacionLocal: string;

  @ValidateNested({ each: true })
  @Type(() => EvidenciaItemDto)
  evidencias: EvidenciaItemDto[];
}

export class SincronizarLoteTanqueosDto {
  @OptionalText({ maxLength: 100 })
  idempotencyKey?: string;

  @RequiredText({ maxLength: 100 })
  dispositivoId: string;

  @RequiredBoolean()
  creadoOffline: boolean;

  @ValidateNested({ each: true })
  @Type(() => TanqueoItemDto)
  tanqueos: TanqueoItemDto[];
}
