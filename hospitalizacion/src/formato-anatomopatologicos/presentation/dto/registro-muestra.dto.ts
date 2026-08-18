import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PacienteMuestraDto {
  @IsString()
  @MaxLength(30)
  numeroDocumento: string;

  @IsString()
  @MaxLength(200)
  nombres: string;

  @IsString()
  @MaxLength(200)
  eps: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso?: number;
}

export class CupsItemDto {
  @IsString()
  @MaxLength(20)
  cups: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @MaxLength(250)
  especimen: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  sospechoso?: string;
}

export class GuardarRegistroMuestraDto {
  @IsDateString()
  fechaTomaMuestra: string;

  @IsDateString()
  fechaRecepcionLabPatologia: string;

  @ValidateNested()
  @Type(() => PacienteMuestraDto)
  paciente: PacienteMuestraDto;

  @IsString()
  @MaxLength(200)
  institucionOrigen: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  prestadorExterno?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CupsItemDto)
  cupsItems: CupsItemDto[];
}
