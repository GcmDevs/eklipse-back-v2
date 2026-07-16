import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CrearSeguimientoSemanaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  semanaNumero: number;

  @IsDateString()
  fechaSeguimiento: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  estadoCodigo: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  destinoCodigo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  accionCodigo?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsable?: string;

  @IsOptional()
  @IsDateString()
  egresoEstimado?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  escalada?: string;
}
