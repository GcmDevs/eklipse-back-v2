import {
  GCM_CONTEXTS,
  GcmContextCode,
  GcmContextType,
  gcmContextFactory,
} from '@common/domain/types';

const CONTEXTOS_SOLICITUD_PEDIDO = new Set<GcmContextCode>([
  GCM_CONTEXTS.ALTACENTRO.getCode(),
  GCM_CONTEXTS.VALLEDUPAR.getCode(),
  GCM_CONTEXTS.SANJUAN.getCode(),
  GCM_CONTEXTS.AGUACHICA.getCode(),
]);

export const contextoSolicitudPedidoFactory = (contextCode: GcmContextCode): GcmContextType => {
  if (!CONTEXTOS_SOLICITUD_PEDIDO.has(contextCode)) {
    throw new Error('El contexto no esta habilitado para solicitudes de pedido');
  }

  return gcmContextFactory(contextCode);
};
