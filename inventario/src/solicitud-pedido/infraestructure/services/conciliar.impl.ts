import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { GenerateReporteSolicitudPedidoPayoad } from '@inn/solicitud-pedido/presentation/dtos';
import { SolicitudPedidoHistorialOrm, SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';

@Injectable()
export class ConciliarSolicitudPedidoImpl extends BaseSource {
  public async execute(payload: GenerateReporteSolicitudPedidoPayoad) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const historialRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);

      const solicitudPedido = await solicitudPedidoRp.findOne({
        where: { id: payload.solicitudPedidoId },
      });

      if (!solicitudPedido) {
        throw new Error('No existe solicitud con este id');
      }

      const ahora = new Date();
      solicitudPedido.estadoCode = payload.estadoCode;

      const historial = new SolicitudPedidoHistorialOrm();
      historial.solicitudPedidoId = solicitudPedido.id;
      historial.estadoCode = payload.estadoCode;
      historial.fechaCambio = ahora;
      historial.usuarioId = this.auth.id;
      historial.sedeId = solicitudPedido.sedeId;
      historial.observacion = payload.observacion ? payload.observacion : null;

      await historialRp.save(historial);

      await solicitudPedidoRp.save(solicitudPedido);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      await qr.rollbackTransaction();

      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
