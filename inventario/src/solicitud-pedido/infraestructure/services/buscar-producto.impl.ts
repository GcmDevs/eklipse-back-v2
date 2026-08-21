import { Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';

import { BaseSource } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@inn/orm/inn/productos';
import { SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import {
  estadoSolicitudPedidoTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES,
} from '@inn/types/inn/solicitud-pedido';

export interface ValidacionProductoResponse {
  existeEnOtraSolicitud: boolean;
  solicitudes: {
    id: number;
    numeroSolicitud: string;
    sede: string;
    estado: string;
    cantidadPendiente: number;
  }[];
}

export interface BuscarProductoResponse extends ValidacionProductoResponse {
  id: number;
  codigo: string;
  descripcion: string;
}

@Injectable()
export class BuscarProductoImpl extends BaseSource {
  public async execute(codigo: string, sedeId: number): Promise<BuscarProductoResponse> {
    if (!Number.isInteger(sedeId) || sedeId <= 0) {
      throw new Error('Debe enviar una sede valida');
    }

    const ctx = gcmContextFactory(this.auth.context.getCode());

    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const producto = await productoRp.findOne({
        where: { codigo },
      });

      if (!producto) throw new Error('No existe producto con este código');

      const solicitudProductoRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const productosPendientes = await solicitudProductoRp.find({
        where: {
          productoId: producto.id,
          estadoDespachoCode: Not(ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode()),
          solicitudPedido: {
            sedeId,
            estadoCode: Not(In(ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES)),
          },
        },
        relations: ['solicitudPedido', 'solicitudPedido.sede'],
        order: { solicitudPedido: { fechaCreacion: 'ASC' } },
      });

      const solicitudes = [
        ...new Map(
          productosPendientes
            .filter(
              detalle => calcularCantidadPendiente(detalle.cantidad, detalle.cantidadEnviada) > 0
            )
            .map(detalle => [
              detalle.solicitudPedido.id,
              {
                id: detalle.solicitudPedido.id,
                numeroSolicitud: detalle.solicitudPedido.numeroSolicitud,
                sede: detalle.solicitudPedido.sede.nombre.trim(),
                estado: estadoSolicitudPedidoTypeFactory(
                  detalle.solicitudPedido.estadoCode
                ).getForHumans(),
                cantidadPendiente: calcularCantidadPendiente(
                  detalle.cantidad,
                  detalle.cantidadEnviada
                ),
              },
            ])
        ).values(),
      ];

      return {
        id: producto.id,
        codigo: producto.codigo,
        descripcion: producto.descripcionLarga,
        existeEnOtraSolicitud: solicitudes.length > 0,
        solicitudes,
      };
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}

const calcularCantidadPendiente = (cantidadSolicitada: number, cantidadEnviada?: number): number =>
  Number(Math.max(0, Number(cantidadSolicitada) - Number(cantidadEnviada ?? 0)).toFixed(4));
