import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConsultaReportes } from '../../domain/consulta';

export class BusquedaReportesDto {
  @ApiProperty({ description: 'Cédula del paciente', maxLength: 20, example: '1065819503' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Revisa el número de cédula.' })
  @Matches(/^\d{1,20}$/, { message: 'La cédula debe contener entre 1 y 20 dígitos.' })
  documento: string;
}

export interface ConsultaReportesResponse extends ConsultaReportes {}
