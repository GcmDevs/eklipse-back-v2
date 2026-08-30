import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { PrioridadCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { GcmContexts } from '@common/domain/types';
import { castDataServices } from '@common/application/services';

export class AprobacionSolicitudByGerenteDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  prioridadCode: PrioridadCode;
  @ApiProperty()
  @IsBoolean()
  isAprobado: boolean;
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  observaciones: string;
}

export class AprobacionCotizacionByCtCDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsBoolean()
  isAprobado: boolean;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observaciones: string;
}

export class ItemsRecomendadosByCotizadorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  contextCode: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  itemsIds: number[];
}

export class ConvertirACajaMenorExpressDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GcmContexts, { message: `${castDataServices.enumToString(GcmContexts)}` })
  context: GcmContexts;
  @ApiProperty()
  @IsNumber()
  solicitudId: number;
  @ApiProperty()
  @IsNumber()
  presupuesto: number;
  @ApiProperty()
  @IsString()
  @IsOptional()
  observacion: string;
}
