import { ADMIN_AUTHORITY } from '@common/application/constants';
import { ALL_CONTEXTS_WITH_AUTHORITIES, GCM_CONTEXTS, GcmContextCode } from '@common/domain/types';
import { HPN_AUTHORITIES } from '@authorities';

export interface TrasladosSocketAccess {
  contextos: GcmContextCode[];
  personal: boolean;
}

/** Alcance de las audiencias del módulo; no modifica la autorización HTTP compartida. */
export function resolveTrasladosSocketAccess(
  contexto: GcmContextCode,
  authorities: string[]
): TrasladosSocketAccess | null {
  const codes = new Set(authorities);
  const permisos = HPN_AUTHORITIES.GESTION_CLINICA;
  const admin = codes.has(ADMIN_AUTHORITY);
  const gestion = admin || codes.has(permisos.GESTION_TRASLADO);
  const agregar = admin || codes.has(permisos.AGREGAR_TRASLADO);
  const seguimiento = admin || codes.has(permisos.SEGUIMIENTO_TRASLADO);
  const clinicas = ALL_CONTEXTS_WITH_AUTHORITIES.map(ctx => ctx.getCode());
  if ((!gestion && !agregar && !seguimiento) || !clinicas.includes(contexto)) return null;

  return {
    contextos:
      gestion && contexto === GCM_CONTEXTS.ALTACENTRO.getCode()
        ? clinicas
        : gestion || agregar
          ? [contexto]
          : [],
    // El creador sigue recibiendo sus novedades; Seguimiento conserva asignaciones entre clínicas.
    personal: agregar || seguimiento,
  };
}
