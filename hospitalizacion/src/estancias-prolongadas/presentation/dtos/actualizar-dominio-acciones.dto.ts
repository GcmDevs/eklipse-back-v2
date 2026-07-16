import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DominioAccionesEstados } from '../../application/enums';

export class ActualizarAccionDominioDto {
  @IsOptional()
  @IsEnum(DominioAccionesEstados)
  estados?: DominioAccionesEstados;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsable?: string;

  @IsOptional()
  @IsDateString()
  estimatedDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;
}
