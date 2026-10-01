import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DominioAccionesEstados } from '../../application/enums';
import { CrearSeguimientoSemanaDto } from './crear-seguimiento-semana.dto';

export class CrearEstanProPacienteDto {
  @ApiProperty({ description: 'Fecha de ingreso del paciente', type: String, format: 'date-time' })
  @IsDateString()
  fechaIngreso: string;

  @ApiProperty({ description: 'Número de ingreso hospitalario' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @ApiProperty({ description: 'Nombre completo del paciente' })
  @IsString()
  @MaxLength(250)
  nombrePaciente: string;

  @ApiProperty({ description: 'Documento del paciente' })
  @IsString()
  @MaxLength(50)
  documento: string;

  @ApiProperty({ description: 'Edad actual' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  age: number;

  @ApiProperty({ description: 'Cama actual del paciente' })
  @IsString()
  @MaxLength(50)
  cama: string;

  @ApiPropertyOptional({ description: 'Piso actual' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  piso?: string;

  @ApiPropertyOptional({ description: 'Municipio de residencia o procedencia' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  municipio?: string;

  @ApiPropertyOptional({ description: 'EPS / entidad pagadora' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  eps?: string;

  @ApiProperty({ description: 'Auditor responsable del caso' })
  @IsString()
  @MaxLength(150)
  auditor: string;

  @ApiPropertyOptional({ description: 'Médico tratante' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  medicoTratante?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico principal del caso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnostico?: string;

  @ApiProperty({ description: 'Días de estancia actuales' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentLos: number;

  @ApiProperty({ description: 'Sede donde se encuentra el paciente' })
  @IsString()
  @MaxLength(150)
  sede: string;

  @ApiPropertyOptional({ description: 'Grupo al que pertenece el paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  grupo?: string;
}

export class CrearAccionDominioDto {
  @ApiProperty({ description: 'Dominio al que pertenece la acción' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dominioId: number;

  @ApiProperty({ description: 'Descripción de la acción definida por auditoría' })
  @IsString()
  @MaxLength(1000)
  accionEspecifica: string;

  @ApiPropertyOptional({ description: 'Estado inicial de la acción', enum: DominioAccionesEstados })
  @IsOptional()
  @IsEnum(DominioAccionesEstados)
  estado?: DominioAccionesEstados;

  @ApiPropertyOptional({ description: 'Responsable de ejecutar la acción' })
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
  fechaEstimada?: string;

  @ApiPropertyOptional({ description: 'Observación de seguimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;

  @ApiPropertyOptional({
    description: 'IDs de usuarios que recibiran notificacion por esta accion',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  usuarioIds?: number[];
}

export class CrearEstanProDto {
  @ApiProperty({ type: () => CrearEstanProPacienteDto })
  @ValidateNested()
  @Type(() => CrearEstanProPacienteDto)
  paciente: CrearEstanProPacienteDto;

  @ApiProperty({
    description: 'IDs de las preguntas/barreras marcadas en la evaluación',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  selectedItemIds: number[];

  @ApiPropertyOptional({
    description: 'Acciones creadas por dominio durante la evaluación',
    type: () => [CrearAccionDominioDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearAccionDominioDto)
  acciones?: CrearAccionDominioDto[];

  @ApiPropertyOptional({
    description: 'Seguimientos semanales iniciales de la estancia',
    type: () => [CrearSeguimientoSemanaDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearSeguimientoSemanaDto)
  seguimientos?: CrearSeguimientoSemanaDto[];
}

export class UpdateEstanProPacienteDto extends PartialType(CrearEstanProPacienteDto) {}

export class UpdateEstanProDto {
  @ApiPropertyOptional({ type: () => UpdateEstanProPacienteDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEstanProPacienteDto)
  paciente?: UpdateEstanProPacienteDto;

  @ApiPropertyOptional({
    description: 'IDs de las preguntas/barreras marcadas en la evaluacion',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  selectedItemIds?: number[];

  @ApiPropertyOptional({
    description: 'Acciones creadas por dominio durante la evaluacion',
    type: () => [CrearAccionDominioDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearAccionDominioDto)
  acciones?: CrearAccionDominioDto[];
}
