import { GCM_CONTEXTS, GcmContextCode, GcmContextType } from '@common/domain/types';
import { reporteConsumoQuery } from '@inn/solicitud-pedido/application/queries/reporte-consumo.query';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';

export interface ConfiguracionReporteSolicitudPedido {
  contexto: GcmContextType;
  query: () => string;
}

const reportesPorSede = new Map<string, ConfiguracionReporteSolicitudPedido>([
  [
    `${GCM_CONTEXTS.ALTACENTRO.getCode()}:1`,
    { contexto: GCM_CONTEXTS.ALTACENTRO, query: () => reporteConsumoQuery([2, 39]) },
  ],
  [
    `${GCM_CONTEXTS.ALTACENTRO.getCode()}:2`,
    { contexto: GCM_CONTEXTS.ALTACENTRO, query: () => reporteConsumoQuery([101, 105, 106, 153]) },
  ],
]);

export const obtenerConfiguracionReporte = (
  contextCode: GcmContextCode,
  sedeId: number
): ConfiguracionReporteSolicitudPedido => {
  if (!Number.isSafeInteger(sedeId) || sedeId <= 0) {
    throw new Error('La sede debe ser un entero positivo');
  }
  const contexto = contextoSolicitudPedidoFactory(contextCode);
  // Solo ALTACENTRO discrimina almacenes. Los demás contextos operables usan
  // todos los almacenes asociados a la sede, nunca los de otra sede o base.
  if (contextCode !== GCM_CONTEXTS.ALTACENTRO.getCode()) {
    return { contexto, query: () => reporteConsumoQuery(null) };
  }
  const configuracion = reportesPorSede.get(`${contextCode}:${sedeId}`);
  if (!configuracion) {
    throw new Error(
      `El reporte no esta configurado para el contexto ${contextCode} y sede ${sedeId}`
    );
  }
  return configuracion;
};
