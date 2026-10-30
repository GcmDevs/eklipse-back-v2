import { PaginationDto } from '@common/presentation/dto';
import {
  OptionalBoolean,
  OptionalBooleanQuery,
  OptionalDateString,
  OptionalEnum,
  OptionalInteger,
  OptionalNested,
  OptionalNumber,
  OptionalText,
  RequiredBoolean,
  RequiredDateString,
  RequiredEnum,
  RequiredInteger,
  RequiredNestedArray,
  RequiredNumber,
  RequiredText,
} from '@common/presentation/decorators';
import {
  CanalRegistro,
  TipoCombustible,
  UnidadMedidaCombustible,
  EstadoTanqueo,
  TipoActivo,
  TipoEvidencia,
  OrigenTanqueo,
  TipoRegistroTanqueo,
  MotivoUbicacionNoDisponible,
  ResultadoValidacionUbicacion,
} from '@inn/operaciones/tanqueos/domain/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsUUID,
  ValidateBy,
  ValidateNested,
} from 'class-validator';
import { MAX_KILOMETRAJE } from '@inn/operaciones/tanqueos/domain/policies/tanqueo-estacion.policies';

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

export class UbicacionInicialTanqueoDto {
  @RequiredNumber({ min: -90, max: 90 })
  latitud: number;

  @RequiredNumber({ min: -180, max: 180 })
  longitud: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;

  @RequiredDateString()
  fechaCaptura: string;
}

function ValidateUbicacionCompletaYExcluyente(): PropertyDecorator {
  return ValidateBy({
    name: 'ubicacionCompletaYExcluyente',
    validator: {
      validate(_value: unknown, args): boolean {
        const obj = (args?.object ?? {}) as TanqueoItemDto;
        const hasLat = obj.latitud !== undefined && obj.latitud !== null;
        const hasLon = obj.longitud !== undefined && obj.longitud !== null;
        const hasFechaCap =
          obj.fechaCapturaUbicacion !== undefined &&
          obj.fechaCapturaUbicacion !== null &&
          obj.fechaCapturaUbicacion !== '';
        const hasMotivo =
          obj.ubicacionNoDisponibleMotivo !== undefined &&
          obj.ubicacionNoDisponibleMotivo !== null;

        if ((hasLat || hasLon || hasFechaCap) && !(hasLat && hasLon && hasFechaCap)) {
          return false;
        }
        if (hasMotivo && (hasLat || hasLon || hasFechaCap)) {
          return false;
        }
        return true;
      },
      defaultMessage(): string {
        return 'Las coordenadas (latitud, longitud y fechaCapturaUbicacion) deben enviarse completas o ausentes, y son excluyentes con ubicacionNoDisponibleMotivo.';
      },
    },
  });
}

/** Datos del tanqueo (sin metadatos de sede/canal; van en la raíz del request). */
export class CreateTanqueoPayloadDto {
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

  @OptionalDateString()
  fechaTanqueo?: string;

  @OptionalText({ maxLength: 500 })
  motivoFechaRetroactiva?: string;

  @OptionalInteger({ min: 1, max: MAX_KILOMETRAJE })
  kilometraje?: number;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string;

  @OptionalEnum(TipoRegistroTanqueo)
  tipoRegistro?: TipoRegistroTanqueo;

  @OptionalInteger({ min: 1 })
  conductorRealOid?: number;

  @RequiredNestedArray(() => EvidenciaItemDto)
  evidencias: EvidenciaItemDto[];
}

export class CreateTanqueoRepositorioRequestDto {
  @RequiredEnum(CanalRegistro)
  canalRegistro: CanalRegistro;

  @ValidateNested()
  @Type(() => CreateTanqueoPayloadDto)
  tanqueo: CreateTanqueoPayloadDto;
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

  @OptionalBooleanQuery()
  tieneAlertas?: boolean;

  @OptionalText({ maxLength: 20 })
  placa?: string;

  @OptionalEnum(TipoActivo)
  tipoActivo?: TipoActivo;

  @OptionalEnum(ResultadoValidacionUbicacion)
  resultadoUbicacion?: ResultadoValidacionUbicacion;
}

export class ChangeEstadoTanqueoDto {
  @OptionalText({ maxLength: 500 })
  motivo?: string;
}

export class CorregirTanqueoCambiosDto {
  @OptionalInteger({ min: 1, max: MAX_KILOMETRAJE })
  kilometraje?: number;

  @OptionalNumber({ min: 0.01 })
  cantidadCombustible?: number;

  @OptionalEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible?: UnidadMedidaCombustible;

  @OptionalNumber({ min: 0.01 })
  valorTotalPagado?: number;

  @OptionalInteger({ min: 1 })
  estacionServicioId?: number;

  @OptionalText()
  fechaTanqueo?: string;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string | null;
}

export class CorregirTanqueoDto {
  @RequiredText({ minLength: 10, maxLength: 500 })
  motivo: string;

  @ValidateNested()
  @Type(() => CorregirTanqueoCambiosDto)
  cambios: CorregirTanqueoCambiosDto;
}

export class RevisarTanqueoDto {
  @RequiredEnum(EstadoTanqueo)
  estadoDestino: EstadoTanqueo;

  @OptionalText({ maxLength: 500 })
  motivo?: string;
}

export class TanqueoEvidenciaDto {
  @RequiredEnum(TipoEvidencia)
  tipo: TipoEvidencia;

  @RequiredInteger({ min: 1 })
  mediaId: number;

  @OptionalText({ maxLength: 500 })
  motivo?: string;
}

export class EliminarTanqueoEvidenciaDto {
  @RequiredText({ maxLength: 500 })
  motivo: string;
}

export class ReasignarTanqueoEvidenciaDto {
  @RequiredEnum(TipoEvidencia)
  tipoDestino: TipoEvidencia;

  @RequiredText({ maxLength: 500 })
  motivo: string;
}

export class OrdenTanqueoEvidenciasDto {
  @IsArray()
  @IsEnum(TipoEvidencia, { each: true })
  tipos: TipoEvidencia[];
}

export class AnularTanqueoDto {
  @RequiredText({ maxLength: 500 })
  motivoAnulacion: string;
}

export class TanqueoItemDto {
  @IsUUID()
  @RequiredText({ maxLength: 36 })
  @ValidateUbicacionCompletaYExcluyente()
  clienteUuid: string;

  @RequiredInteger({ min: 1 })
  activoId: number;

  @OptionalInteger({ min: 1, max: MAX_KILOMETRAJE })
  kilometraje?: number;

  @RequiredNumber({ min: 0.01 })
  valorTotalPagado: number;

  @RequiredNumber({ min: 0.01 })
  cantidadCombustible: number;

  @RequiredEnum(UnidadMedidaCombustible)
  unidadMedidaCombustible: UnidadMedidaCombustible;

  @RequiredEnum(TipoCombustible)
  tipoCombustible: TipoCombustible;

  @RequiredInteger({ min: 1 })
  estacionServicioId: number;

  @RequiredText()
  fechaTanqueo: string;

  @OptionalNumber({ min: -90, max: 90 })
  latitud?: number;

  @OptionalNumber({ min: -180, max: 180 })
  longitud?: number;

  @OptionalNumber({ min: 0 })
  precisionMetros?: number;

  @OptionalDateString()
  fechaCapturaUbicacion?: string;

  @OptionalNested(() => UbicacionInicialTanqueoDto)
  ubicacionInicial?: UbicacionInicialTanqueoDto;

  @OptionalEnum(MotivoUbicacionNoDisponible)
  ubicacionNoDisponibleMotivo?: MotivoUbicacionNoDisponible;

  @OptionalBoolean()
  gpsSimulado?: boolean;

  @OptionalText({ maxLength: 1000 })
  observaciones?: string;

  @RequiredText()
  fechaCreacionLocal: string;

  @ValidateNested({ each: true })
  @Type(() => EvidenciaItemDto)
  evidencias: EvidenciaItemDto[];

  @OptionalEnum(TipoRegistroTanqueo)
  tipoRegistro?: TipoRegistroTanqueo;

  @OptionalInteger({ min: 1 })
  conductorRealOid?: number;
}

export class SincronizarLoteTanqueosDto {
  @RequiredText({ maxLength: 100 })
  idempotencyKey: string;

  @RequiredText({ maxLength: 100 })
  dispositivoId: string;

  @RequiredBoolean()
  creadoOffline: boolean;

  @OptionalEnum(CanalRegistro)
  canalRegistro?: CanalRegistro;

  @ValidateNested({ each: true })
  @Type(() => TanqueoItemDto)
  tanqueos: TanqueoItemDto[];
}
