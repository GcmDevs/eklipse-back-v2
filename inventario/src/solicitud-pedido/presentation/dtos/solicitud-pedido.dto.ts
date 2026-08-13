import { GcmContextCode } from '@common/domain/types';
import {
  EstadoProductosCode,
  ESTADOS_PRODUCTOS_CODES,
  EstadoSolicitudPedidoCode,
} from '@inn/types/inn/solicitud-pedido';
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

  @IsString()
  observacionRechazo: string;
}

export class GenerateReporteSolicitudPedidoPayoad {
  @IsString()
  contextCode: GcmContextCode;

  @IsNumber()
  solicitudPedidoId: number;

  @IsNumber()
  estadoCode: EstadoSolicitudPedidoCode;

  @IsString()
  @IsOptional()
  observacion: string;
}
