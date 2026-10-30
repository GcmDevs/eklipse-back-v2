import {
  CausaCierreDeclaracion,
  CausaCierreLimpieza,
  EstadoDeclaracion,
  EstadoDotacion,
  EstadoLimpieza,
  ModalidadDeclaracion,
} from '../enums';

export type FormularioEstadoCodigo =
  | 'NO_INICIADO'
  | 'EN_CURSO'
  | 'COMPLETO'
  | 'CERRADO_CON_PENDIENTES'
  | 'VENCIDO_SIN_CERRAR'
  | 'SIN_DILIGENCIAR';

export interface FormularioEstado {
  estado: FormularioEstadoCodigo;
  borradorDescartado?: boolean;
}

export function estadoLimpiezaVisible(
  filas: Array<{ estado: EstadoLimpieza; causaCierre?: CausaCierreLimpieza }>,
): FormularioEstado {
  if (!filas.length) return { estado: 'NO_INICIADO' };
  if (filas.some(f => f.estado === EstadoLimpieza.BORRADOR)) return { estado: 'EN_CURSO' };
  if (filas.some(f => f.estado === EstadoLimpieza.INCOMPLETO && f.causaCierre === CausaCierreLimpieza.VENCIMIENTO)) {
    return { estado: 'VENCIDO_SIN_CERRAR' };
  }
  if (filas.some(f => f.estado === EstadoLimpieza.INCOMPLETO)) return { estado: 'CERRADO_CON_PENDIENTES' };
  if (filas.every(f => f.estado === EstadoLimpieza.DILIGENCIADO)) return { estado: 'COMPLETO' };
  return { estado: 'CERRADO_CON_PENDIENTES' };
}

export function estadoDeclaracionVisible(input: {
  existe: boolean;
  estado?: EstadoDeclaracion;
  modalidad?: ModalidadDeclaracion;
  causaCierre?: CausaCierreDeclaracion;
} | null): FormularioEstado | null {
  if (input === null) return null;
  if (!input.existe) return { estado: 'NO_INICIADO' };
  if (input.estado === EstadoDeclaracion.EN_EDICION) return { estado: 'EN_CURSO' };
  if (input.modalidad === ModalidadDeclaracion.COMPLETO) return { estado: 'COMPLETO' };
  if (input.modalidad === ModalidadDeclaracion.SIN_RESPUESTAS) return { estado: 'SIN_DILIGENCIAR' };
  if (
    input.causaCierre === CausaCierreDeclaracion.VENCIMIENTO ||
    input.causaCierre === CausaCierreDeclaracion.CIERRE_PROCESO
  ) {
    return { estado: 'VENCIDO_SIN_CERRAR' };
  }
  return { estado: 'CERRADO_CON_PENDIENTES' };
}

export function estadoDotacionVisible(input: {
  existe: boolean;
  estado?: EstadoDotacion;
  completa?: boolean;
  cierreAutomatico?: boolean;
  fechaUltimoCierre?: Date | null;
} | null): FormularioEstado {
  if (!input || !input.existe) return { estado: 'NO_INICIADO' };
  if (input.estado === EstadoDotacion.EN_CURSO) return { estado: 'EN_CURSO' };
  const borradorDescartado = !!input.cierreAutomatico && !!input.fechaUltimoCierre;
  if (input.cierreAutomatico && !input.fechaUltimoCierre) {
    return { estado: 'VENCIDO_SIN_CERRAR', borradorDescartado: false };
  }
  if (input.completa) return { estado: 'COMPLETO', borradorDescartado };
  return { estado: 'CERRADO_CON_PENDIENTES', borradorDescartado };
}
