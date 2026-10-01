import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { RiskLevel } from '../../application/enums';

export class FindStaysQueryDto {
  @ApiPropertyOptional({ description: 'Filtro por documento del paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @ApiPropertyOptional({ description: 'Filtro por auditor' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  auditor?: string;

  @ApiPropertyOptional({ description: 'Filtro por nivel de riesgo', enum: RiskLevel })
  @IsOptional()
  @IsEnum(RiskLevel)
  nivelRiesgo?: RiskLevel;

  @ApiPropertyOptional({ description: 'Filtro por cama' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cama?: string;

  @ApiPropertyOptional({
    description: 'Fecha de ingreso inicial',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  admissionDateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha de ingreso final', type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  admissionDateTo?: string;
}
