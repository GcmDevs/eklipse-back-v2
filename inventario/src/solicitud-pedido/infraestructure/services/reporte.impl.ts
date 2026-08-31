import { Injectable } from '@nestjs/common';

import { GcmContextCode } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { obtenerConfiguracionReporte } from './reporte-configuracion';
import {
  ReporteSolicitudPedidoRawRow,
  ReporteSolicitudPedidoResponse,
  transformarReporteSolicitudPedido,
} from './reporte-solicitud-pedido';

@Injectable()
export class ReporteSolicitudPedidoImpl extends BaseSource {
  async execute(
    contextCode: GcmContextCode,
    sedeId: number
  ): Promise<ReporteSolicitudPedidoResponse> {
    const configuracion = obtenerConfiguracionReporte(contextCode, sedeId);
    const qr = this.dynamicQR(configuracion.contexto);

    try {
      await qr.connect();
      const filas: ReporteSolicitudPedidoRawRow[] = await qr.query(configuracion.query());
      return transformarReporteSolicitudPedido(filas, contextCode, sedeId);
    } catch (error: any) {
      throw new Error(`No fue posible generar el reporte: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}
