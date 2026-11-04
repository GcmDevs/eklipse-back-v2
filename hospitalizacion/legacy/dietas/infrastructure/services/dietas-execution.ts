import { DataSource } from 'typeorm';
import { GcmContextType } from '@common/domain/types';

/** Contexto interno. Nunca se obtiene del cuerpo de una solicitud HTTP. */
export interface DietasExecution {
  conn: DataSource;
  context: GcmContextType;
  usuarioId: number;
  fecha: Date;
  origen: 'MANUAL' | 'AUTOMATICA';
  canIgnoreHorario: boolean;
}

export interface ResultadoRegistroDietas {
  success: boolean;
  message: string;
  data: any[];
  codigo: 'REGISTRADO' | 'YA_REGISTRADO' | 'VALIDACION';
  registradas: number;
}
