import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateTurnoDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number

  @IsOptional()
  @IsString()
  observacion: string

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  medicoIds: number[];
}

export class HabilitaRTurnoDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number;

  @IsString()
  motivo: string;
}

export class fetchTurnoDto {
  @IsNumber()
  @Type(() => Number)
  subgrupoId: number;

  @IsString()
  fechaInicio: string;

  @IsString()
  fechaFinal: string;
}

export class DatosClinicosDto {
  @IsString()
  @IsOptional()
  diagnostico: string;

  @IsString()
  @IsOptional()
  reporteLab: string;

  @IsString()
  @IsOptional()
  pendientes: string;

  @IsString()
  @IsOptional()
  reporteImg: string;

  @IsString()
  @IsOptional()
  especialidadTratante: string;

  @IsString()
  @IsOptional()
  tratamiento: string;
}

export class CreateOrUpdateEvolucionDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number;

  @IsNumber()
  @IsOptional()
  pacienteId: number;

  @IsNumber()
  ingresoId: number;

  @IsString()
  evolucion: string;
}
export class CreateRegistroClinicoDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number;

  @IsNumber()
  pacienteId: number;

  @IsNumber()
  ingresoId: number;

  @ValidateNested()
  @Type(() => DatosClinicosDto)
  datosClinicos: DatosClinicosDto;
}

export class UpdateRegistroClinicoDto {
  @IsNumber()
  registroClinicoId: number;

  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  ingresoId: number;

  @ValidateNested()
  @Type(() => DatosClinicosDto)
  datosClinicos: DatosClinicosDto;
}

export class CreateEntregaTurnoDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number;

  @IsNumber()
  medicoRecibeId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PacienteDto)
  pacientes: PacienteDto[];
}

export class PacienteDto {
  @IsNumber()
  id: number;

  @IsNumber()
  ingreso: number;
}

export class CreateRecibeTurnoDto {
  @IsNumber()
  subgrupoId: number;

  @IsNumber()
  centroId: number;

  @IsBoolean()
  @IsOptional()
  isCambioTurno: boolean;

  @IsString()
  @IsOptional()
  motivo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PacienteDto)
  pacientes: PacienteDto[];
}
