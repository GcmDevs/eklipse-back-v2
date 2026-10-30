import { CodigoInconsistencia, EstadoTanqueo, SeveridadInconsistencia } from '../enums';
import { EstadoInconsistencia, ResultadoInconsistencia } from '../enums/estados.enum';

export interface TanqueoCorreccionLigadaRead {
  id: number;
  campo: string;
  motivo: string;
  fecha: Date;
  usuarioId: number;
}

export interface TanqueoInconsistenciaRead {
  id: number;
  tanqueoId: number;
  codigo: CodigoInconsistencia;
  campo: string | null;
  severidad: SeveridadInconsistencia;
  estado: EstadoInconsistencia;
  resultado: ResultadoInconsistencia | null;
  fechaDeteccion: Date;
  resueltoPorUsuarioId: number | null;
  resueltoPorNombre: string | null;
  fechaResolucion: Date | null;
  contactoRealizado: boolean;
  notaContacto: string | null;
  notaResolucion: string | null;
  /** Presente en detalle de tanqueo cuando la inconsistencia tiene corrección ligada en BD. */
  correccion?: TanqueoCorreccionLigadaRead | null;
}

export interface TanqueoInconsistenciaContextRead {
  id: number;
  codigo: string;
  activoPlaca: string;
  activoModelo: string | null;
  usuarioNombre: string;
  fechaTanqueo: Date;
  estado: EstadoTanqueo;
  kilometraje: number | null;
  valorTotalPagado: number | null;
  cantidadInconsistencias: number;
}

export interface TanqueoInconsistenciasGrupoRead {
  tanqueo: TanqueoInconsistenciaContextRead;
  inconsistencias: TanqueoInconsistenciaRead[];
}
