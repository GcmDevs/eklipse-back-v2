import { TipoAccionAprobacion } from '@equipos/domain/enums';

export interface ProcessSolicitudBase {
  equipoId: number;
  tipoAccion: TipoAccionAprobacion;
  payload: Record<string, any>;
}

export interface ProcessSolicitudInput extends ProcessSolicitudBase {
  directaAccess: boolean;
}
