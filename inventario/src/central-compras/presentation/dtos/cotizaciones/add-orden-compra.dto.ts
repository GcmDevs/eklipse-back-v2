import {
  ValidateNested,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TipoPagoCode } from '@inn/types/inn/central-compras/cotizaciones';
import { castDataServices } from '@common/application/services';
import { GcmContexts } from '@common/domain/types';

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

export class AddOCDto {
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
