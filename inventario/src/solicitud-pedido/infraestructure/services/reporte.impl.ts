import { Injectable } from '@nestjs/common';

import { GcmContextCode } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { obtenerConfiguracionReporte } from './reporte-configuracion';
import { referenciasConsumoQuery } from '../../application/queries/reporte-consumo.query';
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
    if (contextCode !== this.auth.context.getCode()) {
      throw new Error('El reporte debe consultarse en el contexto de la sesion');
    }
    const configuracion = obtenerConfiguracionReporte(contextCode, sedeId);
    const qr = this.dynamicQR(configuracion.contexto);

    try {
      await qr.connect();
      const [corte] = await qr.query(
        'SELECT CONVERT(varchar(10), GETDATE(), 23) AS fechaCorte FROM ADNCENATE WHERE OID = @0',
        [sedeId]
      );
      if (!corte) throw new Error('La sede seleccionada no existe en este contexto');
      const parametros = [corte.fechaCorte, sedeId];
      const filas: ReporteSolicitudPedidoRawRow[] = await qr.query(
        configuracion.query(),
        parametros
      );
      const referencias: ReporteSolicitudPedidoRawRow[] = await qr.query(
        referenciasConsumoQuery(),
        parametros
      );
      return transformarReporteSolicitudPedido(
        filas,
        contextCode,
        sedeId,
        corte.fechaCorte,
        referencias
      );
    } catch (error: any) {
      throw new Error(`No fue posible generar el reporte: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}
