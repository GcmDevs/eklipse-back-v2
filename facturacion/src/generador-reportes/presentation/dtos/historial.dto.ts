import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PROCESOS_REPORTES, ProcesoReportes } from '../../domain/proceso';

export class HistorialReportesDto {
  @ApiPropertyOptional({
    description: 'Página de reportes generados (10 por página)',
    default: 1,
    minimum: 1,
    maximum: 100000,
  })
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser mayor o igual a 1.' })
  @Max(100000, { message: 'La página debe ser menor o igual a 100000.' })
  pagina: number = 1;

  @ApiPropertyOptional({ description: 'Parte del documento del paciente', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El documento debe ser un texto.' })
  @Matches(/^(?:\d{1,20})?$/, { message: 'El documento debe contener hasta 20 dígitos.' })
  documento?: string;

  @ApiPropertyOptional({ description: 'Parte del consecutivo del ingreso', maxLength: 20 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El ingreso debe ser un texto.' })
  @Matches(/^(?:\d{1,20})?$/, { message: 'El ingreso debe contener hasta 20 dígitos.' })
  ingreso?: string;

  @ApiPropertyOptional({
    description: 'Proceso de auditoría o reportes anteriores',
    enum: [...PROCESOS_REPORTES, 'anteriores'],
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El proceso debe ser un texto.' })
  @IsIn(['', ...PROCESOS_REPORTES, 'anteriores'], {
    message: 'Selecciona un proceso de auditoría válido.',
  })
  proceso?: ProcesoReportes | 'anteriores' | '';

  @ApiPropertyOptional({ description: 'Parte del nombre del archivo', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El archivo debe ser un texto.' })
  @MaxLength(100, { message: 'El nombre del archivo no puede tener más de 100 caracteres.' })
  archivo?: string;

  @ApiPropertyOptional({ description: 'Buscar en los reportes generados', maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto.' })
  @MaxLength(100, { message: 'La búsqueda no puede tener más de 100 caracteres.' })
  busqueda?: string;
}
