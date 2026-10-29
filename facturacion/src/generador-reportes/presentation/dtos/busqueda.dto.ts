import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsultaReportes } from '../../domain/consulta';
import { PROCESOS_REPORTES, ProcesoReportes } from '../../domain/proceso';

export class BusquedaReportesDto {
  @ApiProperty({ description: 'Proceso de auditoría', enum: [...PROCESOS_REPORTES] })
  @IsIn(PROCESOS_REPORTES, { message: 'Selecciona un proceso de auditoría válido.' })
  proceso: ProcesoReportes;

  @ApiProperty({ description: 'Cédula del paciente', maxLength: 20, example: '1065819503' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Revisa el número de cédula.' })
  @Matches(/^\d{1,20}$/, { message: 'La cédula debe contener entre 1 y 20 dígitos.' })
  documento: string;
}

export interface ConsultaReportesResponse extends ConsultaReportes {}
