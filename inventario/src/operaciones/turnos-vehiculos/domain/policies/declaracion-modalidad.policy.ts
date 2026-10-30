import { BadInputError } from '@common/domain/errors';
import { ModalidadDeclaracion, RespuestaEntregaItem, RolDeclaracion } from '../enums';
import { EntregaItemJson } from '../types';

export function countPendientesEntrega(items: EntregaItemJson[]): number {
  return items.filter(i => i.respuesta === RespuestaEntregaItem.SIN_REPORTAR || i.respuesta === 'SIN_REPORTAR').length;
}

export function resolveModalidadEntrega(items: EntregaItemJson[]): ModalidadDeclaracion {
  const pendientes = countPendientesEntrega(items);
  if (pendientes === items.length) return ModalidadDeclaracion.SIN_RESPUESTAS;
  if (pendientes === 0) return ModalidadDeclaracion.COMPLETO;
  return ModalidadDeclaracion.PARCIAL;
}

export type TipoVehiculoLimpieza = 'AMBULANCIA' | 'CARRO_ADMINISTRATIVO';

export const CATEGORIAS_LIMPIEZA: Record<TipoVehiculoLimpieza, string> = {
  AMBULANCIA: 'cat_lim_movil',
  CARRO_ADMINISTRATIVO: 'cat_lim_admin',
};

const ADMIN_ITEM_KEYS = new Set(['lim_18', 'lim_19', 'lim_20', 'lim_21']);

export function isItemAplicableLimpieza(itemKey: string, tipo: TipoVehiculoLimpieza = 'AMBULANCIA'): boolean {
  if (tipo === 'CARRO_ADMINISTRATIVO') {
    return ADMIN_ITEM_KEYS.has(itemKey);
  }
  return !ADMIN_ITEM_KEYS.has(itemKey);
}

export function countPendientesLimpieza(
  items: { key?: string; respuesta: 'C' | 'NC' | null }[],
  tipo: TipoVehiculoLimpieza = 'AMBULANCIA',
): number {
  return items.filter(i => {
    if (i.key && !isItemAplicableLimpieza(i.key, tipo)) {
      return false;
    }
    return i.respuesta === null;
  }).length;
}

export function parseRolDeclaracion(rol: string): RolDeclaracion {
  const upper = rol?.toUpperCase();
  if (upper === RolDeclaracion.ENTREGA) return RolDeclaracion.ENTREGA;
  if (upper === RolDeclaracion.RECEPCION) return RolDeclaracion.RECEPCION;
  throw new BadInputError('Rol inválido. Debe ser ENTREGA o RECEPCION');
}
