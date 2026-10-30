import { EstadoSolicitud, TipoAccionAprobacion } from "../enums";
import { EquipoMinimalRead } from "./equipo.read";

export interface SolicitudRead {
  id: number;
  codigo: string;
  equipo: EquipoMinimalRead;
  tipoAccion: TipoAccionAprobacion;
  estado: EstadoSolicitud;
  solicitante: {
    id: number;
    nombreCompleto: string;
  }
  aprobador: {
    id?: number;
    nombreCompleto?: string;
  }
  fechaResolucion?: Date;
  payload: Record<string, any>;
  motivoRechazo?: string;
  esAutoAprobada: boolean;
  tiempoResolucion: string | null; 
  createdAt: Date;
  updatedAt: Date;
}
