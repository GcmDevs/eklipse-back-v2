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
import { CrearSeguimientoSemanaDto } from './crear-seguimiento-semana.dto';
import { PartialType } from '@nestjs/swagger';
import { DominioAccionesEstados } from '@hpn/estancias-prolongadas/application/enums';

export class CrearEstanProPacienteDto {
  @IsDateString()
  fechaIngreso: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ingreso: number;

  @IsString()
  @MaxLength(250)
  nombrePaciente: string;

  @IsString()
  @MaxLength(50)
  documento: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  age: number;

  @IsString()
  @MaxLength(50)
  cama: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  piso?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  eps?: string;

  @IsString()
  @MaxLength(150)
  auditor: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  medicoTratante?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnostico?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  currentLos: number;

  @IsString()
  @MaxLength(150)
  sede: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  grupo?: string;
}

export class CrearAccionDominioDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dominioId: number;

  @IsString()
  @MaxLength(1000)
  accionEspecifica: string;

  @IsOptional()
  @IsEnum(DominioAccionesEstados)
  estado?: DominioAccionesEstados;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  responsable?: string;

  @IsOptional()
  @IsDateString()
  fechaEstimada?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacion?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  usuarioIds?: number[];
}

export class CrearEstanProDto {
  @ValidateNested()
  @Type(() => CrearEstanProPacienteDto)
  paciente: CrearEstanProPacienteDto;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  selectedItemIds: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearAccionDominioDto)
  acciones?: CrearAccionDominioDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearSeguimientoSemanaDto)
  seguimientos?: CrearSeguimientoSemanaDto[];
}

export class UpdateEstanProPacienteDto extends PartialType(CrearEstanProPacienteDto) {}

export class ActualizarEstanciaProlongadaDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateEstanProPacienteDto)
  paciente?: UpdateEstanProPacienteDto;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  selectedItemIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearAccionDominioDto)
  acciones?: CrearAccionDominioDto[];
}
