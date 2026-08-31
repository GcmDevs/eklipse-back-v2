import { Injectable } from '@nestjs/common';

import { BaseSource } from '@common/infrastructure/services';
import {
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoOrm,
  SolicitudPedidoProductoOrm,
} from '@inn/orm/inn/solicitud-pedido';
import {
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
  esSolicitudPedidoCerrada,
} from '@inn/types/inn/solicitud-pedido';
import { RechazarSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import { calcularEstadoSolicitudPedido } from './solicitud-pedido-rules';

@Injectable()
export class RechazarSolicitudPedidoImpl extends BaseSource {
  async execute(payload: RechazarSolicitudPedidoPayload) {
    const ctx = contextoSolicitudPedidoFactory(payload.contextCode);
    const observacion = payload.observacionRechazo?.trim();
    if (!observacion) throw new Error('Debe registrar el motivo del rechazo');
    if (payload.alcance === 'PRODUCTOS' && !payload.solicitudPedidoProductoIds?.length) {
      throw new Error('Debe seleccionar al menos un producto para rechazar');
    }
    if (payload.alcance === 'PEDIDO' && payload.solicitudPedidoProductoIds?.length) {
      throw new Error('El rechazo de pedido no debe incluir una seleccion de productos');
    }

    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();
      const solicitudRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const productoRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const historialRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);
      const solicitud = await solicitudRp.findOne({
        where: { id: payload.solicitudPedidoId },
        relations: ['productos', 'productos.producto'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!solicitud) throw new Error('No existe solicitud de pedido con este id');
      if (esSolicitudPedidoCerrada(solicitud.estadoCode)) {
        throw new Error('La solicitud ya se encuentra cerrada y no admite rechazos');
      }

      const idsPayload = payload.solicitudPedidoProductoIds ?? [];
      if (new Set(idsPayload).size !== idsPayload.length) {
        throw new Error('No puede seleccionar el mismo producto mas de una vez');
      }

      const productosActivos = solicitud.productos.filter(producto => {
        const estado = producto.estadoDespachoCode;
        return (
          estado !== ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode() &&
          estado !== ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode() &&
          estado !== ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode() &&
          Number(producto.cantidad) -
            Number(producto.cantidadEnviada ?? 0) -
            Number(producto.cantidadRechazada ?? 0) -
            Number(producto.cantidadSobrepedido ?? 0) >
            0
        );
      });
      const productosSeleccionados =
        payload.alcance === 'PEDIDO'
          ? productosActivos
          : idsPayload.map(id => {
              const producto = productosActivos.find(item => item.id === id);
              if (!producto) {
                throw new Error(`El producto de solicitud ${id} no esta disponible para rechazo`);
              }
              return producto;
            });

      if (!productosSeleccionados.length) {
        throw new Error('La solicitud no tiene productos disponibles para rechazo');
      }

      const ahora = new Date();
      productosSeleccionados.forEach(producto => {
        producto.cantidadRechazada = Number(
          (
            Number(producto.cantidad) -
            Number(producto.cantidadEnviada ?? 0) -
            Number(producto.cantidadRechazada ?? 0) -
            Number(producto.cantidadSobrepedido ?? 0)
          ).toFixed(4)
        );
        producto.estadoDespachoCode = ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode();
        producto.observacionRechazo = observacion;
        producto.fechaRechazo = ahora;
        producto.usuarioRechazoId = this.auth.id;
      });

      const estadoAnterior = solicitud.estadoCode;
      solicitud.estadoCode = this._calcularEstadoSolicitud(solicitud);
      if (solicitud.estadoCode === ESTADOS_SOLICITUD_PEDIDO.RECHAZADO.getCode()) {
        solicitud.obervacionRechazo = observacion;
      }

      await productoRp.save(productosSeleccionados);
      await solicitudRp.save(solicitud);

      const codigos = productosSeleccionados.map(producto => producto.producto.codigo.trim());
      await historialRp.save(
        historialRp.create({
          solicitudPedidoId: solicitud.id,
          estadoCode: solicitud.estadoCode,
          fechaCambio: ahora,
          usuarioId: this.auth.id,
          sedeId: solicitud.sedeId,
          observacion: `${
            payload.alcance === 'PEDIDO' ? 'Rechazo de la solicitud' : 'Rechazo de productos'
          } (${codigos.join(', ')}). Motivo: ${observacion}`,
        })
      );

      await qr.commitTransaction();
      return {
        solicitudPedidoId: solicitud.id,
        numeroSolicitud: solicitud.numeroSolicitud,
        estadoAnterior,
        estadoCode: solicitud.estadoCode,
        productosRechazados: productosSeleccionados.map(producto => ({
          solicitudPedidoProductoId: producto.id,
          codigo: producto.producto.codigo,
          cantidadRechazada: Number(producto.cantidadRechazada),
        })),
      };
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private _calcularEstadoSolicitud(solicitud: SolicitudPedidoOrm) {
    return calcularEstadoSolicitudPedido(
      solicitud.productos.map(producto => producto.estadoDespachoCode)
    );
  }
}
