import { GCM_CONTEXTS, GcmContextCode, GcmContextType } from '@common/domain/types';
import { getReporteAlta } from '@inn/solicitud-pedido/application/queries/reporte-alta.query';
import { getReporteCentro } from '@inn/solicitud-pedido/application/queries/reporte-centro.query';

export interface ConfiguracionReporteSolicitudPedido {
  contexto: GcmContextType;
  query: () => string;
}

const reportesPorSede = new Map<string, ConfiguracionReporteSolicitudPedido>([
  [
    `${GCM_CONTEXTS.ALTACENTRO.getCode()}:1`,
    { contexto: GCM_CONTEXTS.ALTACENTRO, query: getReporteCentro },
  ],
  [
    `${GCM_CONTEXTS.ALTACENTRO.getCode()}:2`,
    { contexto: GCM_CONTEXTS.ALTACENTRO, query: getReporteAlta },
  ],
]);

export const obtenerConfiguracionReporte = (
  contextCode: GcmContextCode,
  sedeId: number
): ConfiguracionReporteSolicitudPedido => {
  const configuracion = reportesPorSede.get(`${contextCode}:${sedeId}`);
  if (!configuracion) {
    throw new Error(
      `El reporte no esta configurado para el contexto ${contextCode} y sede ${sedeId}`
    );
  }
  return configuracion;
};
