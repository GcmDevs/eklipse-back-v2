import { GcmContextCode } from '@common/domain/types';
import { EstadoControlGastoCode } from '@inn/lgc/cgt/types/inn/farmacia/control-gastos/estado-control-gasto.type';
import { AREA, AreaCode } from '@inn/lgc/cgt/types/inn/farmacia/control-gastos/area.type';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateControlGastosPayload {
  @IsNumber()
  @ValidateIf(or => or.area !== AREA.MAOS.getCode())
  @IsOptional()
  suministroPacienteId?: number;

  @IsNumber()
  @IsOptional()
  trasladoProductoId?: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsString()
  area: AreaCode;

  @IsNumber()
  sedeId: number;

  @IsString()
  fechaProcedimiento: Date;

  @IsString()
  @IsOptional()
  documentoFileName: string;

  @IsNumber()
  @ValidateIf(or => or.area === AREA.MAOS.getCode())
  @IsOptional()
  ingreso?: number;
}

export class ItemReporteControlGastosPayload {
  @IsNumber()
  itemSuministroPacienteId: number;

  @IsNumber()
  itemReporteControlGastoId: number;

  @IsBoolean()
  isConciliado: boolean;
}

export class GenerateReporteControlGastosPayload {
  @IsNumber()
  @IsOptional()
  suministroPacienteId: number;

  @IsNumber()
  @IsOptional()
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  estadoCode: EstadoControlGastoCode;

  @IsString()
  @IsOptional()
  observacion: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ItemReporteControlGastosPayload)
  detalle: ItemReporteControlGastosPayload[];
}

export class SolicitudOrdenesControlGastosPayload {
  @IsOptional()
  @IsIn(['compra', 'traslado'])
  grupo?: 'compra' | 'traslado';

  @IsInt()
  @Min(1)
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;
}

export class DescartarOrdenControlGastosPayload extends SolicitudOrdenesControlGastosPayload {
  @IsOptional()
  @IsInt()
  @Min(1)
  archivoId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  documentoAnteriorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivoRechazo?: string;
}

export class AsociarOrdenControlGastosPayload extends SolicitudOrdenesControlGastosPayload {
  @IsIn([0, 19, 24])
  ordenRelacionadaTipoCode: 0 | 19 | 24;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  ordenRelacionadaConsecutivo: string;
}

export class CargarFacturaControlGastosPayload {
  @IsNumber()
  @IsOptional()
  suministroPacienteId: number;

  @IsNumber()
  @IsOptional()
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsString()
  facturaFileName: string;
}

export class RechazarDocumentoControlGastosPayload {
  @IsInt()
  @Min(1)
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  observacionRechazo: string;
}
export class DocumentoVistoControlGastosPayload {
  @IsNumber()
  @IsOptional()
  suministroPacienteId: number;

  @IsNumber()
  @IsOptional()
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsBoolean()
  hasVisto: boolean;
}
export class SolicitudMaosPayload {
  @IsString()
  @IsOptional()
  documento: string;

  @IsNumber()
  @IsOptional()
  ingreso: number;

  @IsString()
  contextCode: GcmContextCode;
}

export class UpdateControlGastoPayload {
  @IsNumber()
  idControlGasto: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsString()
  facturaFileName: string;

  @IsBoolean()
  isEps: boolean;

  @IsString()
  @IsOptional()
  observacionSolicitud?: string;
}
