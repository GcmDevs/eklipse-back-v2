import { NivelRiesgo } from '@hpn/estancias-prolongadas/application/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class BuscarEstanciasQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  auditor?: string;

  @IsOptional()
  @IsEnum(NivelRiesgo)
  nivelRiesgo?: NivelRiesgo;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cama?: string;

  @IsOptional()
  @IsDateString()
  admissionDateFrom?: string;

  @IsOptional()
  @IsDateString()
  admissionDateTo?: string;
}
