import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches } from 'class-validator';
import { PROCESOS_REPORTES, ProcesoReportes } from '../../domain/proceso';

export class GeneracionReportesDto {
  @ApiProperty({ description: 'Proceso de auditoría', enum: [...PROCESOS_REPORTES] })
  @IsIn(PROCESOS_REPORTES, { message: 'Selecciona un proceso de auditoría válido.' })
  proceso: ProcesoReportes;

  @ApiProperty({ description: 'Cédula del paciente', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{1,20}$/)
  documento: string;

  @ApiProperty({ description: 'Consecutivo del ingreso', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\d{1,20}$/)
  ingreso: string;
}
