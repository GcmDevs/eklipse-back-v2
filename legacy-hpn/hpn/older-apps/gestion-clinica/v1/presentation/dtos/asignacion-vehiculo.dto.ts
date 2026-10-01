import { GcmContextCode } from '@common/domain/types';
import {
  EstadoTrasladoTypeCode,
  SignoVitalType,
  TipoEmpleadoCode,
  TipoProfesionalCode,
  TipoTurnoEmpleadoCode,
} from '@hpn/gestion-clinica/v1/domain/types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class EkEmpleadoOrUsuarioDto {
  @IsString()
  @IsOptional()
  nombre: string;

  @IsString()
  @IsOptional()
  documento: string;
}

export class AsignacionVehiculoDto {
  @IsNumber()
  gestionId: number;

  @IsNumber()
  @IsOptional()
  conductorId: number;

  @IsBoolean()
  @IsOptional()
  conductorIsUsuario: boolean;

  @IsString()
  @IsOptional()
  docConductor: string;

  @IsString()
  @IsOptional()
  nombreConductor: string;

  @IsString()
  vehiculo: number;

  @IsString()
  acompanante: string;

  @IsString()
  docAcompanante: string;

  @IsNumber()
  @IsOptional()
  medicoId: number;

  @IsBoolean()
  @IsOptional()
  medicoIsUsuario: boolean;

  @IsString()
  @IsOptional()
  nombreMedico: string;

  @IsString()
  @IsOptional()
  docMedico: string;

  @IsNumber()
  @IsOptional()
  auxiliarId: number;

  @IsBoolean()
  @IsOptional()
  auxiliarIsUsuario: boolean;

  @IsString()
  @IsOptional()
  nombreAuxiliar: string;

  @IsString()
  @IsOptional()
  docAuxiliar: string;

  @IsString()
  @IsOptional()
  observacion: string;
}

export class InstitucionDto {
  @IsString()
  nit: string;

  @IsString()
  nombre: string;
}
export class EmpleadoDto {
  @IsNumber()
  @IsOptional()
  id: number;

  @IsString()
  nombre: string;

  @IsString()
  documento: string;

  @IsBoolean()
  @IsOptional()
  isUsuario: boolean;

  @IsNumber()
  tipoEmpleadoCode: TipoEmpleadoCode | TipoProfesionalCode;

  @IsOptional()
  @ValidateNested()
  @Type(() => InstitucionDto)
  institucion: InstitucionDto;
}

export class EmpleadoIdDto {
  @IsNumber()
  id: number;

  @IsString()
  @IsOptional()
  documento: string;

  @IsNumber()
  tipoEmpleadoCode: TipoEmpleadoCode;
}

export class NewAsignacionVehiculoDto {
  @ValidateNested()
  @IsOptional()
  @Type(() => EkEmpleadoOrUsuarioDto)
  acompanante: EkEmpleadoOrUsuarioDto;

  @IsNumber()
  asigVehiculoId: number;

  @IsString()
  contexto: GcmContextCode;

  @ValidateNested()
  @IsOptional()
  @Type(() => EkEmpleadoOrUsuarioDto)
  auxiliar: EkEmpleadoOrUsuarioDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => EkEmpleadoOrUsuarioDto)
  conductor: EkEmpleadoOrUsuarioDto;

  @ValidateNested()
  @IsOptional()
  @Type(() => EkEmpleadoOrUsuarioDto)
  medico: EkEmpleadoOrUsuarioDto;

  @IsNumber()
  gestionId: number;

  @IsString()
  @IsOptional()
  observacion: string;

  @IsNumber()
  trasladoId: number;
}

export class VehiculoDto {
  @IsNumber()
  id: number;

  @IsString()
  placa: string;
}

export class UsuarioExisteDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  isUsuario: boolean;

  @IsNumber()
  tipoEmpleadoCode: TipoEmpleadoCode;
}

export class CreateAndAsignarUsuarioDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => VehiculoDto)
  vehiculo: VehiculoDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UsuarioExisteDto)
  empleadoExiste: UsuarioExisteDto[];

  @IsNumber()
  @IsOptional()
  tipoTurnoCode: TipoTurnoEmpleadoCode;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EmpleadoDto)
  empleado: EmpleadoDto[];

  @IsBoolean()
  isActivo: boolean;
}

export class SignosVitalesDto {
  @IsNumber()
  signoCode: number;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  @IsOptional()
  ta: number;
}

export class ProfesionalDto {
  @IsString()
  nombre: string;

  @IsString()
  documento: string;
}
export class TrasladoInicarOrFinalizarDto {
  @IsNumber()
  trasladoId: number;

  @IsString()
  contextoCode: GcmContextCode;

  @IsString()
  @IsOptional()
  observacion: string;

  @IsNumber()
  @IsOptional()
  estadoCode: EstadoTrasladoTypeCode;

  @IsBoolean()
  @IsOptional()
  isAddObservacion: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SignosVitalesDto)
  signosVitales?: SignosVitalesDto[];

  @ValidateNested()
  @IsOptional()
  @Type(() => EmpleadoDto)
  recibido?: EmpleadoDto;
}
