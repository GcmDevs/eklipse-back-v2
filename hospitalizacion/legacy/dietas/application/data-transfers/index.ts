import {
  JornadaType,
  DieJorEstadoType,
  DieEstadoType,
  MotivoDevolucionDietaType,
  JornadaCode,
} from '@lgc/die/domain/types';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export interface ConfDietExtraPayload {
  pacienteId: number;
  jornada: JornadaCode;
  incluyeDietaFamiliarDesayuno: boolean;
  incluyeDietaFamiliarAlmuerzo: boolean;
  incluyeDietaFamiliarCena: boolean;
  incluyeMeriendaDesayuno: boolean;
  incluyeMeriendaAlmuerzo: boolean;
  incluyeMeriendaCena: boolean;
  tipoMerienda: string;
}

export interface ConfDietExtraDto extends Omit<ConfDietExtraPayload, 'jornada' | 'estanciaId'> {
  id: number;
}

export interface InfoDietaCentroDto {
  id: number;
  centro: { id: number; nombre: string };
  fecha: Date;
  jornada: JornadaType;
  estado: DieJorEstadoType;
  dietas?: DietaDto[];
}

export interface DietaDto {
  id: number;
  estancia: { id: number };
  subgrupo: { nombre: string; codigo: string };
  cama: { codigo: string };
  paciente: { nombreCompleto: string; fechaNacimiento: Date };
  tipo: string;
  consistencia: string;
  createdAt: Date;
  createdBy: number;
  canBeDeleted: boolean;
  precio: number;
  dietasExtraordinarias: { tipo: string; consistencia: string; precio: number }[];
  estado: DieEstadoType;
  incluyeMerienda: boolean | null;
  incluyeDietaFamiliar: boolean | null;
  tipoMerienda: string | null;
  observacion: string;
  motivoDevolucion: MotivoDevolucionDietaType;
  observacionDevolucion: string;
  enAislamiento: boolean | null;
}

export interface JornadaCentroDto {
  id: number;
  jornadaDesayunoId: number;
  jornadaAlmuerzoId: number;
  jornadaCenaId: number;
}

export class UpdateDietaDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsNumber()
  pacienteId: number;

  @IsNumber()
  camaId: number;

  @IsNumber()
  horarioId: number;

  @IsNumber()
  dieCentroId: number;

  @IsNumber()
  dieJornadaId: number;

  @IsNumber()
  dieSubgrupoId: number;

  @IsString()
  dietaConfig: string;

  @IsBoolean()
  @IsOptional()
  enAislamiento: boolean;

  @IsString()
  @IsOptional()
  observacion: string | null;
}

/** @deprecated */
export interface OldUpdateDietaPayload {
  dietaId: number;
  tipoDieta: string;
  consistenciaDieta: string;
  codigoCama: string;
  paciente: number;
  observacion: string;
  estancia: number;
  jornada: JornadaCode | null;
  dietaCentroId: number | null;
  dietaJornadaId: number | null;
  dietaGrupoId: number | null;
  dietaCentroAtencion: number | null;
  dietaSubgrupo: number | null;
  enAislamiento: boolean | null;
}
