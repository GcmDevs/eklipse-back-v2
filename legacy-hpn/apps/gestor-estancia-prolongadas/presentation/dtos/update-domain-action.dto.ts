import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DominioAccionesEstados } from '../../application/enums';

export class UpdateDomainActionDto {
  @ApiPropertyOptional({ description: 'Nuevo estado de la acción', enum: DominioAccionesEstados })
  @IsOptional()
  @IsEnum(DominioAccionesEstados)
  estados?: DominioAccionesEstados;

  @ApiPropertyOptional({ description: 'Responsable actualizado' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsable?: string;

  @ApiPropertyOptional({
    description: 'Fecha estimada de cumplimiento',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  estimatedDate?: string;

  @ApiPropertyOptional({ description: 'Observación o trazabilidad de la acción' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;
}
