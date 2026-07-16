import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CerrarEstanciaDto {
  @IsDateString()
  fechaEgreso: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  losTotal: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  destinoFinalCodigo: number;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  firmaMedico?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  losResultadoCodigo: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  barreraCriticaCodigo: number;

  @IsOptional()
  @IsString()
  accionEfectiva?: string;

  @IsOptional()
  @IsString()
  accionInefectiva?: string;

  @IsOptional()
  @IsString()
  leccionAprendida?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  protocoloSuficienteCodigo: number;

  @IsOptional()
  @IsString()
  observacionesCierre?: string;
}
