import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GcmContexts } from '@common/domain/types';
import {
  IsNumber,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsOptional,
  IsString,
  IsEnum,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';
import { TipoPagoCode } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { castDataServices } from '@common/application/services';

export class CuotaOCDto {
  @ApiProperty()
  @IsNumber()
  noCuota: number;
  @ApiProperty()
  @IsNumber()
  porcentaje: number;
  @ApiProperty()
  @IsNumber()
  diasPlazo: number;
  @ApiProperty()
  @IsBoolean()
  alFinalizarTrabajo: boolean;
}

export class AgregarOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsString()
  consecutivo: string;
  @ApiProperty()
  @IsNumber()
  tipoPago: TipoPagoCode;
  @ApiProperty({ type: CuotaOCDto, isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CuotaOCDto)
  @IsOptional()
  cuotas: CuotaOCDto[];
}

export class ProgramarOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsDateString()
  @IsOptional()
  fecha: Date;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsNumber()
  aprobadoCode: 1 | 2 | 3;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class ContabilizarOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsString()
  @IsOptional()
  consecutivo: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  codigoComprobanteContable: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  codigoComprobanteContableAnio: string;
  @ApiProperty()
  @IsNumber()
  retefuente: number;
  @ApiProperty()
  @IsNumber()
  reteica: number;
  @ApiProperty()
  @IsNumber()
  reteIVA: number;
  @ApiProperty()
  @IsNumber()
  valorDescuento: number;
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isContabilizacionUnica: boolean;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class PagarOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsNumber()
  valorPagado: number;
  @ApiProperty()
  @IsString()
  fileName: string;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class ReportarOrdenCompraListaEntregaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class RecibirOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsNumber()
  isAprobado: boolean;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class DetalleCotizacionDto {
  @ApiProperty()
  @IsNumber()
  itemCotizadoId: number;
  @ApiProperty()
  @IsNumber()
  valorUnitario: number;
  @ApiProperty()
  @IsNumber()
  porcDescuento: number;
  @ApiProperty()
  @IsBoolean()
  incluyeIVA: boolean;
}

export class CreateCotizacionDto {
  @ApiProperty()
  @IsOptional()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsOptional()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  context: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  proveedorId: number;
  @ApiProperty()
  @IsOptional()
  @IsString()
  nombreProveedor: string;
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleCotizacionDto)
  detalle: DetalleCotizacionDto[];
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isCotizacionUnica: boolean;
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isPagoPorCajaMenor: boolean;
  @ApiProperty()
  @IsOptional()
  @IsString()
  fileName: string;
}

export class ConfirmarOrdenCompraDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  context: GcmContexts;
  @ApiProperty()
  @IsNumber()
  cotizacionId: number;
  @ApiProperty()
  @IsNumber()
  isAprobado: 1 | 2 | 3;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}
