import { JornadaCode } from '@lgc/die/domain/types/local';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

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
