import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ProductoOrm } from '@inn/orm/inn/productos';

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
      const catalogo = qr.manager.getRepository(ProductoOrm);
      const seleccionados = await catalogo.findBy({ id: In(productoIds) });
      if (seleccionados.length !== productoIds.length || seleccionados.some(producto => !producto.agrupamientoId)) {
        throw new Error('Debe enviar productos con agrupamiento válido');
      }
      const hijos = await catalogo.findBy({ agrupamientoId: In(seleccionados.map(producto => producto.agrupamientoId)) });
      const idsImpacto = hijos.map(producto => producto.id);
      const solicitudes = await buscarSolicitudesImpactadas(
        qr.manager.getRepository(SolicitudPedidoOrm),
        qr.manager.getRepository(SolicitudPedidoProductoOrm),
        payload.sedeId,
        idsImpacto,
        false,
        seleccionados.map(producto => producto.agrupamientoId),
      );
      return construirImpactoSobrepedido(solicitudes, idsImpacto, seleccionados.map(producto => producto.agrupamientoId));
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
