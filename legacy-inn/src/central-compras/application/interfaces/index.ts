import { EstadoEspecificoType, EstadoType } from '@ctypes/inn/central-compras/solicitudes';
import { SolicitudOrm } from '@orm/inn/central-compras';

export interface ExistenciaActualI {
  cantidad: number;
  cantidadByAuditor?: number;
  vencimientoMasCercano: Date;
  isVencimientoProximo: boolean;
  stockMinimo?: number;
  stockMaximo?: number;
  costoPromedio?: number;
  puntoReposicion?: number;
  /** @deprecated Implicito */
  productoId?: number;
  /** @deprecated Implicito */
  agrupamientoId?: number;
  /** @deprecated Reemplazar por "cantidad" */
  existenciaActual?: number;
}

export interface CreateCambioEstadoI {
  estado: EstadoType;
  estadoEspecifico: EstadoEspecificoType;
  solicitud: SolicitudOrm;
  archivoRelacionado?: string;
  entidadRelacionadaId?: number;
  informacionAdicional?: string;
  upperCase?: boolean;
}
