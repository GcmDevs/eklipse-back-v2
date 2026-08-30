import { GcmContexts } from '@common/domain/types';
import { TipoPagoCode } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { Type } from 'class-transformer';
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

const enumToString = (_enum: object) =>
  Object.keys(_enum)
    .map(key => _enum[key])
    .filter(value => typeof value === 'string') as string[];

export class OldDetalleCotizacionDto {
  @IsNumber()
  itemCotizadoId: number;

  @IsNumber()
  valorUnitario: number;

  @IsNumber()
  porcDescuento: number;

  @IsBoolean()
  incluyeIVA: boolean;
}

export class OldCrearCotizacionDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  solicitudId: number;

  @IsOptional()
  @IsNumber()
  proveedorId: number;

  @IsOptional()
  @IsString()
  nombreProveedor: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OldDetalleCotizacionDto)
  detalle: OldDetalleCotizacionDto[];

  @IsBoolean()
  @IsOptional()
  isCotizacionUnica: boolean;

  @IsBoolean()
  @IsOptional()
  isPagoPorCajaMenor: boolean;

  @IsOptional()
  @IsString()
  fileName: string;
}

export class OldCuotaDto {
  @IsNumber()
  noCuota: number;

  @IsNumber()
  porcentaje: number;

  @IsNumber()
  diasPlazo: number;

  @IsBoolean()
  alFinalizarTrabajo: boolean;
}

export class OldAddOrdenToCotDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsString()
  consecutivo: string;

  @IsNumber()
  tipoPago: TipoPagoCode;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OldCuotaDto)
  @IsOptional()
  cuotas: OldCuotaDto[];
}

export class ConfirmarOrdenDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsNumber()
  isAprobado: 1 | 2 | 3;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldOrdenListaDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldProgramarOrdenDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsDateString()
  @IsOptional()
  fecha: Date;

  @IsNumber()
  cotizacionId: number;

  @IsNumber()
  isAprobado: 1 | 2 | 3;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldRecibirOrdenDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsNumber()
  isAprobado: 1 | 2;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldContabilizarOrdenDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsString()
  @IsOptional()
  consecutivo: string;

  @IsString()
  @IsOptional()
  codigoComprobanteContable: string;

  @IsString()
  @IsOptional()
  codigoComprobanteContableAnio: string;

  @IsNumber()
  retefuente: number;

  @IsNumber()
  reteica: number;

  @IsNumber()
  reteIVA: number;

  @IsNumber()
  valorDescuento: number;

  @IsBoolean()
  @IsOptional()
  isContabilizacionUnica: boolean;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldPagarOrdenDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  cotizacionId: number;

  @IsNumber()
  valorPagado: number;

  @IsString()
  fileName: string;

  @IsString()
  @IsOptional()
  observaciones: string;
}
