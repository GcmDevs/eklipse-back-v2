import { CodigoInconsistencia, SeveridadInconsistencia, TipoEvidencia } from '../enums';
import { EstadoEvidencia } from '../enums/estados.enum';

export interface Inconsistencia {
  readonly codigo: CodigoInconsistencia;
  readonly campo: string | null;
  readonly severidad: SeveridadInconsistencia;
  readonly mensaje: string;
  readonly fechaResolucion?: Date | null;
}

export function createInconsistencia(
  codigo: CodigoInconsistencia,
  severidad: SeveridadInconsistencia,
  mensaje: string,
  campo: string | null = null
): Inconsistencia {
  return { codigo, campo, severidad, mensaje };
}

export interface EvidenciaEntry {
  readonly tipo: TipoEvidencia;
  readonly estado: EstadoEvidencia;
  readonly mediaId: number | null;
  readonly motivoOmision: string | null;
  readonly fecha: Date;
}
