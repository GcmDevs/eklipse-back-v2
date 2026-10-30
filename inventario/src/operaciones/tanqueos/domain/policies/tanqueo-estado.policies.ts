import { CodigoInconsistencia } from '../enums';

export {
  assertTanqueoMarkReviewed,
  assertTanqueoTransitionState,
  canTanqueoMarkReviewed,
  canTanqueoTransitionState,
  tanqueoInitialState,
} from './machines/tanqueo.sm';

/** @deprecated Use assertTanqueoTransitionState */
export { assertTanqueoTransitionState as assertTransitionEstadoTanqueo } from './machines/tanqueo.sm';
/** @deprecated Use canTanqueoTransitionState */
export { canTanqueoTransitionState as canTransitionEstadoTanqueo } from './machines/tanqueo.sm';
/** @deprecated Use tanqueoInitialState */
export { tanqueoInitialState as estadoInicialTanqueo } from './machines/tanqueo.sm';
/** @deprecated Use canTanqueoMarkReviewed */
export { canTanqueoMarkReviewed as canMarcarRevisado } from './machines/tanqueo.sm';
/** @deprecated Use assertTanqueoMarkReviewed */
export { assertTanqueoMarkReviewed as assertMarcarRevisado } from './machines/tanqueo.sm';

/**
 * Punto único de decisión para determinar si un código de inconsistencia abierta
 * cuenta para el estado del tanqueo (PENDIENTE_REVISION vs REGISTRADO).
 *
 * Hoy todas las inconsistencias abiertas (incluyendo UBIC_*) cuentan.
 * Si negocio decide excluir p. ej. CodigoInconsistencia.UBIC_NO_CONC del cálculo
 * de estado, basta con ajustar esta lista/función.
 */
export const CODIGOS_INCONSISTENCIA_EXCLUIDOS_DE_ESTADO: readonly CodigoInconsistencia[] = [];

export function cuentaCodigoInconsistenciaParaEstado(codigo: CodigoInconsistencia): boolean {
  return !(CODIGOS_INCONSISTENCIA_EXCLUIDOS_DE_ESTADO as readonly string[]).includes(codigo);
}
