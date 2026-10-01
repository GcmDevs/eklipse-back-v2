import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CrearSeguimientoSemanaDto {
  @ApiProperty({ description: 'Numero de semana del seguimiento, entre 1 y 8' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  semanaNumero: number;

  @ApiProperty({ description: 'Fecha del seguimiento semanal', type: String, format: 'date' })
  @IsDateString()
  fechaSeguimiento: string;

  @ApiProperty({ description: 'Codigo del estado del seguimiento, entre 1 y 4' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  estadoCodigo: number;

  @ApiPropertyOptional({ description: 'Codigo del destino, entre 1 y 6' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  destinoCodigo?: number;

  @ApiPropertyOptional({ description: 'Codigo de la accion, entre 1 y 8' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  accionCodigo?: number;

  @ApiPropertyOptional({ description: 'Responsable del seguimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsable?: string;

  @ApiPropertyOptional({ description: 'Fecha estimada de egreso', type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  egresoEstimado?: string;

  @ApiPropertyOptional({ description: 'Observaciones del seguimiento' })
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Escalada definida para semanas criticas' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  escalada?: string;
}
