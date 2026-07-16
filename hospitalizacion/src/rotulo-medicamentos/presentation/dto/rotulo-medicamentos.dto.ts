import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CrearRotuloDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consecutivo: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  pacienteId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  folio: number;

  @IsString()
  @MaxLength(50)
  codigoProducto: string;

  @IsString()
  @MaxLength(50)
  documento: string;

  @IsDateString()
  fechaRotulo: string;

  @IsString()
  @MaxLength(50)
  cama: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  servicio?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dosis: number;

  @IsString()
  @MaxLength(50)
  unidadMedida: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  viaAdministracion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  inicio?: string;
}

export class GuardarRotulosBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearRotuloDto)
  rotulos: CrearRotuloDto[];
}
export class RotuloQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  documento: number;
}

export class RotulosFechaQueryDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFinal?: string;

  @IsString()
  @IsOptional()
  servicio?: string;
}

export class ActualizarRotuloDto {
  @IsDateString()
  fechaRotulo: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dosis: number;

  @IsString()
  @MaxLength(50)
  unidadMedida: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  viaAdministracion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  inicio?: string;
}
