import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';

import { RechazarSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import { SolicitudPedidoHistorialOrm, SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';
import { ESTADOS_SOLICITUD_PEDIDO } from '@inn/types/inn/solicitud-pedido';

@Injectable()
export class RechazarSolicitudPedidoImpl extends BaseSource {
  public async execute(payload: RechazarSolicitudPedidoPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const SolicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const historialRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);

      const solicitudPedido = await SolicitudPedidoRp.findOne({
        where: { id: payload.solicitudPedidoId },
      });

      if (!solicitudPedido) {
        throw new Error('No existe solicitud de pedido con este id');
      }

      const ESTADO_RECHAZADO = ESTADOS_SOLICITUD_PEDIDO.RECHAZADO.getCode();

      solicitudPedido.estadoCode = ESTADO_RECHAZADO;
      solicitudPedido.obervacionRechazo = payload.observacionRechazo;

      const historial = new SolicitudPedidoHistorialOrm();
      historial.solicitudPedidoId = solicitudPedido.id;
      historial.estadoCode = ESTADO_RECHAZADO;
      historial.fechaCambio = new Date();
      historial.usuarioId = this.auth.id;
      historial.observacion = payload.observacionRechazo;
      historial.sedeId = solicitudPedido.sedeId;

      await historialRp.save(historial);

      await SolicitudPedidoRp.save(solicitudPedido);

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
