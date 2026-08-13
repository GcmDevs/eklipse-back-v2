import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';
import { DocumentoVistoSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CheckVistoSolicitudPedidoImpl extends BaseSource {
  public async execute(payload: DocumentoVistoSolicitudPedidoPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();
    try {
      await qr.startTransaction();

      const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);

      const solicitudPedido = await solicitudPedidoRp.findOne({
        where: { id: payload.solicitudPedidoId },
      });

      if (!solicitudPedido) {
        throw new Error('No existe solicitud de pedido con este id');
      }

      solicitudPedido.hasVisto = payload.hasVisto;

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
