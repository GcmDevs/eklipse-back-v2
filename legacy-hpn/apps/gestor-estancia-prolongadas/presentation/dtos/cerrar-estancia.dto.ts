import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CerrarEstanciaDto {
  @ApiProperty({ description: 'Fecha de egreso del paciente', type: String, format: 'date' })
  @IsDateString()
  fechaEgreso: string;

  @ApiProperty({ description: 'Total de dias de estancia' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  losTotal: number;

  @ApiProperty({ description: 'Codigo de destino final, entre 1 y 7' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  destinoFinalCodigo: number;

  @ApiPropertyOptional({ description: 'Firma del medico responsable' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  firmaMedico?: string;

  @ApiProperty({ description: 'Codigo del resultado LOS, entre 1 y 5' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  losResultadoCodigo: number;

  @ApiProperty({ description: 'Codigo de barrera critica, entre 1 y 5' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  barreraCriticaCodigo: number;

  @ApiPropertyOptional({ description: 'Accion efectiva identificada en el cierre' })
  @IsOptional()
  @IsString()
  accionEfectiva?: string;

  @ApiPropertyOptional({ description: 'Accion inefectiva identificada en el cierre' })
  @IsOptional()
  @IsString()
  accionInefectiva?: string;

  @ApiPropertyOptional({ description: 'Leccion aprendida del caso' })
  @IsOptional()
  @IsString()
  leccionAprendida?: string;

  @ApiProperty({ description: 'Codigo de suficiencia del protocolo, entre 1 y 3' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  protocoloSuficienteCodigo: number;

  @ApiPropertyOptional({ description: 'Observaciones del cierre' })
  @IsOptional()
  @IsString()
  observacionesCierre?: string;
}
