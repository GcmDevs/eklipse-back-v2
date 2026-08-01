import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TipoRotulo } from '@hpn/rotulo-medicamentos/shared/types';

const HORA_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const esSolucion = (value: { tipoRotulo?: TipoRotulo }): boolean =>
  value.tipoRotulo === TipoRotulo.Solucion;

export class CrearRotuloDto {
  @IsOptional()
  @IsEnum(TipoRotulo)
  tipoRotulo?: TipoRotulo;

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
  @ValidateIf(value => !esSolucion(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dosis: number;

  @ValidateIf(value => !esSolucion(value))
  @IsString()
  @MaxLength(50)
  unidadMedida: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  viaAdministracion?: string;

  @ValidateIf(value => esSolucion(value) || value.inicio != null)
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'inicio debe tener formato HH:mm' })
  inicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  mezcla?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'preparacion debe tener formato HH:mm' })
  preparacion?: string;

  @ValidateIf(esSolucion)
  @IsString()
  @MaxLength(100)
  velocidadInfusion?: string;

  @ValidateIf(esSolucion)
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'finalizacion debe tener formato HH:mm' })
  finalizacion?: string;
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
  @IsOptional()
  @IsEnum(TipoRotulo)
  tipoRotulo?: TipoRotulo;

  @IsDateString()
  fechaRotulo: string;

  @Type(() => Number)
  @ValidateIf(value => !esSolucion(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dosis: number;

  @ValidateIf(value => !esSolucion(value))
  @IsString()
  @MaxLength(50)
  unidadMedida: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  viaAdministracion?: string;

  @ValidateIf(value => esSolucion(value) || value.inicio != null)
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'inicio debe tener formato HH:mm' })
  inicio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  mezcla?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'preparacion debe tener formato HH:mm' })
  preparacion?: string;

  @ValidateIf(esSolucion)
  @IsString()
  @MaxLength(100)
  velocidadInfusion?: string;

  @ValidateIf(esSolucion)
  @IsString()
  @MaxLength(10)
  @Matches(HORA_PATTERN, { message: 'finalizacion debe tener formato HH:mm' })
  finalizacion?: string;
}
