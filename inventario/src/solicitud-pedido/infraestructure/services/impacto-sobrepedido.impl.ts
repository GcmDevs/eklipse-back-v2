import { Injectable } from '@nestjs/common';

import { BaseSource } from '@common/infrastructure/services';
import { SolicitudPedidoOrm, SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import { ImpactoSobrepedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import { buscarSolicitudesImpactadas, construirImpactoSobrepedido } from './sobrepedido-impacto';

@Injectable()
export class ImpactoSobrepedidoImpl extends BaseSource {
  async execute(payload: ImpactoSobrepedidoPayload) {
    const ctx = contextoSolicitudPedidoFactory(payload.contextCode);
    const productoIds = [...new Set(payload.productoIds)];
    if (!productoIds.length || productoIds.some(id => !Number.isInteger(id) || id <= 0)) {
      throw new Error('Debe enviar productos válidos para calcular el impacto');
    }

    const qr = this.dynamicQR(ctx);
    try {
      await qr.connect();
      const solicitudes = await buscarSolicitudesImpactadas(
        qr.manager.getRepository(SolicitudPedidoOrm),
        qr.manager.getRepository(SolicitudPedidoProductoOrm),
        payload.sedeId,
        productoIds
      );
      return construirImpactoSobrepedido(solicitudes, productoIds);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
