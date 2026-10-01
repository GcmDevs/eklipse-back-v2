import { FilterEstadoMasHijosDto, FilterSearchDto, FilterSearchPaginatedDto, LimitDto } from '@common/presentation/dto';
import {
  OptionalBoolean,
  OptionalEnum,
  OptionalInteger,
  OptionalIntegerArray,
  OptionalNested,
  OptionalNestedArray,
  OptionalText,
  RequiredBoolean,
  RequiredEnum,
  RequiredInteger,
  RequiredIntegerWhen,
  RequiredNestedArray,
  RequiredNumberWhen,
  RequiredText,
  RequiredTextWhen,
  TextAllowedOnlyWhen,
} from '@common/presentation/decorators';
import {
  AccionSincronizacionAccesorio,
  AlcanceSincronizacion,
  Riesgo,
  TipoMedidaCodigo,
  VariableCalibracionCodigo,
} from '@equipos/domain/enums';
import { IntersectionType, PartialType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CreatePeriodoDeTiempoDto } from '../common.dto';
import { CreateDocumentoNestedDto } from './tipo-doc-categoria-activo.dto';

const TIPOS_VALIDOS = [...Object.values(VariableCalibracionCodigo), 'OTR'] as const;

export class VariableCalibracionItemDto {
  @IsIn(TIPOS_VALIDOS)
  tipo: VariableCalibracionCodigo | 'OTR';

  @TextAllowedOnlyWhen((o: VariableCalibracionItemDto) => o.tipo === 'OTR', {
    maxLength: 100,
  })
  nombre?: string;
}

export class CreateDatosCalibracionDto {
  @OptionalText({ maxLength: 100 })
  codigoUltimaCalibracion?: string;

  @OptionalNestedArray(() => VariableCalibracionItemDto)
  variables?: VariableCalibracionItemDto[];
}

export class CreateMedidaDto {
  @RequiredEnum(TipoMedidaCodigo)
  tipo: TipoMedidaCodigo;

  @RequiredNumberWhen((o: CreateMedidaDto) => o.valorMin == null && o.valorMax == null)
  valor?: number;

  @RequiredNumberWhen((o: CreateMedidaDto) => o.valor == null)
  valorMin?: number;

  @RequiredNumberWhen((o: CreateMedidaDto) => o.valor == null)
  valorMax?: number;

  @RequiredInteger({ min: 1 })
  unidadId: number;

  @OptionalText({ maxLength: 100 })
  nombre?: string;
}

export class CreateDatosTecnicosDto {
  @OptionalNestedArray(() => CreateMedidaDto)
  medidas: CreateMedidaDto[];
}

export class CreateClasificacionBiomedicaDto {
  @OptionalBoolean()
  aplicaRegSanitario?: boolean;

  @OptionalBoolean()
  diagnostico?: boolean;

  @OptionalBoolean()
  prevencion?: boolean;

  @OptionalBoolean()
  rehabilitacion?: boolean;

  @OptionalBoolean()
  analisisLaboratorio?: boolean;

  @OptionalBoolean()
  tratamientoMantenimientoDeVida?: boolean;

  @OptionalEnum(Riesgo)
  riesgo?: Riesgo;

  @OptionalText()
  numeroRegSanitario?: string;

  @OptionalText()
  expedienteRegSanitario?: string;
}

export class CreateAccesorioTipoEquipoDto {
  @RequiredIntegerWhen(
    (o: CreateAccesorioTipoEquipoDto) =>
      !(typeof o.parte === 'string' && o.parte.trim().length > 0),
    { min: 1 }
  )
  parteId?: number;

  @RequiredTextWhen((o: CreateAccesorioTipoEquipoDto) => o.parteId == null, {
    maxLength: 120,
  })
  parte?: string;

  @RequiredInteger({ min: 1 })
  cantidad: number;

  @OptionalInteger({ min: 1 })
  marcaId?: number;

  @OptionalText({ maxLength: 120 })
  referencia?: string;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;
}

export class UpdateAccesorioTipoEquipoDto extends PartialType(CreateAccesorioTipoEquipoDto) {}

export class SyncAccesorioDto {
  @RequiredEnum(AccionSincronizacionAccesorio)
  accion: AccionSincronizacionAccesorio;

  @RequiredEnum(AlcanceSincronizacion)
  alcance: AlcanceSincronizacion;

  @OptionalIntegerArray({ min: 1, nonEmpty: true })
  equipoIds?: number[];

  @OptionalText()
  observaciones?: string;
}

export class CreateDocumentoTipoEquipoDto {
  @RequiredInteger({ min: 1 })
  tipoDocumentoId: number;

  @RequiredBoolean()
  aplica: boolean;

  @OptionalInteger({ min: 1 })
  archivoId?: number;

  @OptionalText()
  observaciones?: string;
}

export class UpdateDocumentoTipoEquipoDto extends PartialType(CreateDocumentoTipoEquipoDto) {}

export class CreatePlanDefaultTipoEquipoDto {
  @RequiredText()
  tipo: string;

  @OptionalNested(() => CreatePeriodoDeTiempoDto)
  periocidad?: CreatePeriodoDeTiempoDto;

  @OptionalInteger({ min: 0 })
  diasAntNotif?: number;

  @OptionalBoolean()
  realizaExterno?: boolean;

  @OptionalInteger({ min: 1 })
  formatoId?: number;

  @OptionalText()
  observaciones?: string;
}

export class UpdatePlanDefaultTipoEquipoDto extends PartialType(CreatePlanDefaultTipoEquipoDto) {}

export class FilterPlanDefaultTipoEquipoDto extends IntersectionType(FilterSearchDto, LimitDto) {}


class CreatePlanDefaultNestedDto {
  @RequiredText({ maxLength: 30 })
  tipo: string;

  @OptionalNested(() => CreatePeriodoDeTiempoDto)
  periocidad?: CreatePeriodoDeTiempoDto;

  @OptionalInteger({ min: 0 })
  diasAntNotif?: number;

  @OptionalBoolean()
  realizaExterno?: boolean;

  @OptionalInteger({ min: 1 })
  formatoId?: number;

  @OptionalText({ maxLength: 420 })
  observaciones?: string;
}

export class FichaTecnicaTipoEquipoDto {
  @OptionalNested(() => CreatePeriodoDeTiempoDto)
  vidaUtil?: CreatePeriodoDeTiempoDto;

  @OptionalBoolean()
  reqCalibracion?: boolean;

  @OptionalNested(() => CreateDatosCalibracionDto)
  datosCalibracion?: CreateDatosCalibracionDto;

  @OptionalNested(() => CreateDatosTecnicosDto)
  datosTecnicos?: CreateDatosTecnicosDto;

  @OptionalText({ maxLength: 120 })
  dtCalibNormaAplicable?: string;

  @OptionalNested(() => CreateClasificacionBiomedicaDto)
  clasificacion?: CreateClasificacionBiomedicaDto;
}

export class CreateTipoEquipoDto {
  @RequiredText({ maxLength: 200 })
  nombre: string;

  @RequiredInteger({ min: 1 })
  modeloId: number;

  @RequiredInteger({ min: 1 })
  subclaseId: number;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;

  @OptionalNested(() => FichaTecnicaTipoEquipoDto)
  fichaTecnica?: FichaTecnicaTipoEquipoDto;

  @OptionalNestedArray(() => CreateAccesorioTipoEquipoDto)
  accesorios?: CreateAccesorioTipoEquipoDto[];

  @OptionalNestedArray(() => CreatePlanDefaultNestedDto)
  planesDefault?: CreatePlanDefaultNestedDto[];

  @OptionalNestedArray(() => CreateDocumentoNestedDto)
  documentos?: CreateDocumentoNestedDto[];
}

export class UpdateTipoEquipoDto {
  @OptionalText({ maxLength: 200 })
  nombre?: string;

  @OptionalText({ maxLength: 500 })
  observaciones?: string;

  @OptionalBoolean()
  activo?: boolean;

  @OptionalBoolean()
  sincronizar?: boolean;
}

export class UpdateFichaTecnicaTipoEquipoDto extends FichaTecnicaTipoEquipoDto {
  @OptionalBoolean()
  sincronizar?: boolean;
}

export class FilterTipoEquipoDto extends IntersectionType(
  FilterSearchPaginatedDto,
  FilterEstadoMasHijosDto
) {
  @OptionalInteger({ min: 1 })
  modeloId?: number;

  @OptionalInteger({ min: 1 })
  subclaseId?: number;
}

export class ReplaceTipoEquipoDto extends CreateTipoEquipoDto {
  @OptionalBoolean()
  sincronizar?: boolean;

  @RequiredNestedArray(() => CreateAccesorioTipoEquipoDto)
  accesorios: CreateAccesorioTipoEquipoDto[] = [];

  @RequiredNestedArray(() => CreatePlanDefaultNestedDto)
  planesDefault: CreatePlanDefaultNestedDto[] = [];

  @RequiredNestedArray(() => CreateDocumentoNestedDto)
  documentos: CreateDocumentoNestedDto[] = [];
}
