import { CodigoInconsistencia, EstadoTanqueo, SeveridadInconsistencia } from '../enums';

export interface TanqueoInconsistenciaRead {
  id: number;
  tanqueoId: number;
  codigo: CodigoInconsistencia;
  campo: string | null;
  severidad: SeveridadInconsistencia;
  fechaDeteccion: Date;
  resueltoPorUsuarioId: number | null;
  resueltoPorNombre: string | null;
  fechaResolucion: Date | null;
  contactoRealizado: boolean;
  notaContacto: string | null;
  notaResolucion: string | null;
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
