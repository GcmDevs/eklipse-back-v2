import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CrearDetalleCupsDto {
  @IsString()
  @MaxLength(20)
  codigoCups: string;

  @IsString()
  @MaxLength(500)
  descripcionCups: string;

  @IsString()
  @MaxLength(100)
  tipoCups: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  cantidad: number;

  @IsString()
  @MaxLength(250)
  especimen: string;

  @IsBoolean()
  sospechoso: boolean;
}

export class CrearFormatoMuestraAnatomopatologicaDto {
  @IsString()
  @MaxLength(50)
  numeroCaso: string;

  @IsDateString()
  fechaTomaMuestra: string;

  @IsDateString()
  fechaRecepcionLaboratorio: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @IsString()
  @MaxLength(200)
  nombrePaciente: string;

  @IsString()
  @MaxLength(30)
  numeroDocumento: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  eps?: string;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsBoolean()
  prestadorExterno: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  institucionOrigen?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioCreacionId: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  usuarioCreacionNombre?: string;

  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => CrearDetalleCupsDto)
  cups: CrearDetalleCupsDto[];
}
