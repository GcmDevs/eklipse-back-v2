import { GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';
import { PrioridadCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import {
  IsNumber,
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export class OldCajaMenorExpressDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  solicitudId: number;

  @IsNumber()
  presupuesto: number;

  @IsString()
  @IsOptional()
  observacion: string;
}

export class OldAprobarSolicitudDto {
  @IsNumber()
  solicitudId: number;

  @IsNumber()
  @IsOptional()
  prioridad: PrioridadCode;

  @IsBoolean()
  isAprobado: boolean;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  observaciones: string;
}

export class OldPreaprobarCotizacionDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  solicitudId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  itemsIds: number[];
}

export class OldAprobarCotizacionDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  solicitudId: number;

  @IsBoolean()
  isAprobado: boolean;

  @IsString()
  @IsOptional()
  observaciones: string;
}

export class OldUpdateProdOrServDto {
  @IsNotEmpty()
  @IsEnum(GcmContexts, {
    message: `Opción invalida. Las opciones validas son ${castDataServices.enumToString(GcmContexts)}`,
  })
  context: GcmContexts;

  @IsNumber()
  itemId: number;

  @IsNumber()
  cotizacionId: number;

  @IsNumber()
  @IsOptional()
  productoId: number;

  @IsString()
  @IsOptional()
  nombreServicio: string;

  @IsString()
  @IsOptional()
  nombreMarca: string;

  @IsNumber()
  @IsOptional()
  cantidad: number;
}
