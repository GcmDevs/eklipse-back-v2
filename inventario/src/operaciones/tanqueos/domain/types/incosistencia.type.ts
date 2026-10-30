import { CodigoInconsistencia, SeveridadInconsistencia, TipoEvidencia } from '../enums';
import { EstadoEvidencia, EstadoInconsistencia, ResultadoInconsistencia } from '../enums/estados.enum';

export interface Inconsistencia {
  readonly codigo: CodigoInconsistencia;
  readonly campo: string | null;
  readonly severidad: SeveridadInconsistencia;
  readonly mensaje: string;
  readonly fechaResolucion?: Date | null;
  readonly estado?: EstadoInconsistencia;
  readonly resultado?: ResultadoInconsistencia | null;
}

export function createInconsistencia(
  codigo: CodigoInconsistencia,
  severidad: SeveridadInconsistencia,
  mensaje: string,
  campo: string | null = null
): Inconsistencia {
  return {
    codigo,
    campo,
    severidad,
    mensaje,
    estado: EstadoInconsistencia.ABIERTA,
    fechaResolucion: null,
    resultado: null,
  };
}

export interface EvidenciaEntry {
  readonly tipo: TipoEvidencia;
  readonly estado: EstadoEvidencia;
  readonly mediaId: number | null;
  readonly motivoOmision: string | null;
  readonly fecha: Date;
}
