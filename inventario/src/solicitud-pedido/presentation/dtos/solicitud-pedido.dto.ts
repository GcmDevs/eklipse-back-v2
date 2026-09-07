import { GcmContextCode } from '@common/domain/types';
import { EstadoProductosCode, ESTADOS_PRODUCTOS_CODES } from '@inn/types/inn/solicitud-pedido';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateSolicitudPedidoPayload {
  @IsNumber()
  sedeId: number;

  @IsString()
  contextCode: GcmContextCode;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSolicitudPedidoProductoPayload)
  productos: CreateSolicitudPedidoProductoPayload[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;

  @IsOptional()
  @IsBoolean()
  confirmarSobrepedido?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  versionImpactoSobrepedido?: string;
}

export class ImpactoSobrepedidoPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsInt()
  @Min(1)
  sedeId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  productoIds: number[];
}

export class CreateSolicitudPedidoProductoPayload {
  @IsInt()
  @Min(1)
  productoId: number;

  @IsIn(ESTADOS_PRODUCTOS_CODES)
  estadoCode: EstadoProductosCode;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidad: number;
}

export class ActualizarDespachoProductoPayload {
  @IsInt()
  @Min(1)
  solicitudPedidoProductoId: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  cantidadEnviada: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;
}

export class ActualizarDespachoSolicitudPedidoPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsInt()
  @Min(1)
  solicitudPedidoId: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ActualizarDespachoProductoPayload)
  productos: ActualizarDespachoProductoPayload[];
}

export class CargarFacturaSolicitudPedidoPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  solicitudPedidoId: number;

  @IsString()
  facturaFileName: string;
}

export class DocumentoVistoSolicitudPedidoPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  solicitudPedidoId: number;

  @IsBoolean()
  hasVisto: boolean;
}

export class RechazarSolicitudPedidoPayload {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  solicitudPedidoId: number;

  @IsIn(['PEDIDO', 'PRODUCTOS'])
  alcance: 'PEDIDO' | 'PRODUCTOS';

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  solicitudPedidoProductoIds?: number[];

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  observacionRechazo: string;
}

export class ReporteSolicitudPedidoQuery {
  @IsString()
  @MinLength(1)
  contextCode: GcmContextCode;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sedeId: number;
}
