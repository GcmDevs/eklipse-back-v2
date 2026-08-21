import { Injectable } from '@nestjs/common';

import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import {
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoOrm,
  SolicitudPedidoProductoDespachoOrm,
  SolicitudPedidoProductoOrm,
} from '@inn/orm/inn/solicitud-pedido';
import {
  calcularEstadoDespachoProducto,
  estadoDespachoProductoTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { ActualizarDespachoSolicitudPedidoPayload } from '@inn/solicitud-pedido/presentation/dtos';

@Injectable()
export class ActualizarDespachoSolicitudPedidoImpl extends BaseSource {
  public async execute(payload: ActualizarDespachoSolicitudPedidoPayload) {
    const ctx = gcmContextFactory(payload.contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      await qr.startTransaction();

      const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);
      const historialRp = qr.manager.getRepository(SolicitudPedidoHistorialOrm);
      const solicitudProductoRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const despachoRp = qr.manager.getRepository(SolicitudPedidoProductoDespachoOrm);

      const solicitudPedido = await solicitudPedidoRp.findOne({
        where: { id: payload.solicitudPedidoId },
        relations: ['productos', 'productos.producto'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!solicitudPedido) {
        throw new Error('No existe solicitud de pedido con este id');
      }
      if (!Array.isArray(payload.productos) || payload.productos.length === 0) {
        throw new Error('Debe enviar al menos un producto para despachar');
      }

      const detallesIds = payload.productos.map(producto => producto.solicitudPedidoProductoId);
      if (new Set(detallesIds).size !== detallesIds.length) {
        throw new Error('No puede enviar el mismo producto mas de una vez');
      }

      const ahora = new Date();
      const despachos = payload.productos.map(productoPayload => {
        const detalle = solicitudPedido.productos.find(
          producto => producto.id === productoPayload.solicitudPedidoProductoId
        );

        if (!detalle) {
          throw new Error(
            `El producto de solicitud ${productoPayload.solicitudPedidoProductoId} no pertenece a esta solicitud`
          );
        }
        if (detalle.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode()) {
          throw new Error(`El producto ${detalle.producto.codigo} ya se encuentra facturado`);
        }

        const cantidadSolicitada = Number(detalle.cantidad);
        const cantidadDespachada = Number(productoPayload.cantidadEnviada);
        const cantidadEnviadaAnterior = Number(detalle.cantidadEnviada ?? 0);
        const cantidadEnviadaAcumulada = cantidadEnviadaAnterior + cantidadDespachada;
        const cantidadPendiente = cantidadSolicitada - cantidadEnviadaAnterior;

        if (!Number.isFinite(cantidadDespachada) || cantidadDespachada <= 0) {
          throw new Error('La cantidad enviada debe ser un numero mayor a cero');
        }
        if (cantidadEnviadaAcumulada > cantidadSolicitada) {
          throw new Error(
            `La cantidad enviada del producto ${detalle.producto.codigo} no puede superar la cantidad pendiente (${cantidadPendiente})`
          );
        }

        const estado = calcularEstadoDespachoProducto(cantidadSolicitada, cantidadEnviadaAcumulada);
        detalle.cantidadEnviada = cantidadEnviadaAcumulada;
        detalle.estadoDespachoCode = estado.estadoCode;
        detalle.usuarioId = this.auth.id;

        return despachoRp.create({
          solicitudPedidoProductoId: detalle.id,
          cantidad: cantidadDespachada,
          cantidadAcumulada: cantidadEnviadaAcumulada,
          estadoDespachoCode: estado.estadoCode,
          observacion: productoPayload.observacion?.trim() || null,
          fechaCreacion: ahora,
          usuarioId: this.auth.id,
        });
      });

      const estadoAnterior = solicitudPedido.estadoCode;
      solicitudPedido.estadoCode = this._calcularEstadoSolicitud(solicitudPedido);

      await solicitudProductoRp.save(solicitudPedido.productos);
      await despachoRp.save(despachos);
      await solicitudPedidoRp.save(solicitudPedido);

      if (estadoAnterior !== solicitudPedido.estadoCode) {
        const historial = historialRp.create({
          solicitudPedidoId: solicitudPedido.id,
          estadoCode: solicitudPedido.estadoCode,
          fechaCambio: new Date(),
          usuarioId: this.auth.id,
          sedeId: solicitudPedido.sedeId,
          observacion: 'Estado actualizado por cantidades despachadas',
        });
        await historialRp.save(historial);
      }

      await qr.commitTransaction();

      return {
        solicitudPedidoId: solicitudPedido.id,
        numeroSolicitud: solicitudPedido.numeroSolicitud,
        estadoCode: solicitudPedido.estadoCode,
        despachosRegistrados: despachos.map(despacho => ({
          solicitudPedidoProductoId: despacho.solicitudPedidoProductoId,
          cantidadEnviada: Number(despacho.cantidad),
          cantidadAcumulada: Number(despacho.cantidadAcumulada),
          estadoDespachoCode: despacho.estadoDespachoCode,
          observacion: despacho.observacion ?? null,
          fechaCreacion: despacho.fechaCreacion,
        })),
        productos: solicitudPedido.productos.map(detalle => {
          const cantidadSolicitada = Number(detalle.cantidad);
          const cantidadEnviada = Number(detalle.cantidadEnviada ?? 0);
          const productoFacturado =
            detalle.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode();
          const despachoCalculado = calcularEstadoDespachoProducto(
            cantidadSolicitada,
            cantidadEnviada
          );
          const despacho = productoFacturado
            ? {
                estadoCode: ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode(),
                porcentaje: 100,
              }
            : despachoCalculado;

          return {
            id: detalle.id,
            productoId: detalle.productoId,
            codigo: detalle.producto.codigo,
            cantidadSolicitada,
            cantidadEnviada,
            cantidadPendiente: productoFacturado
              ? 0
              : Math.max(0, cantidadSolicitada - cantidadEnviada),
            porcentajeDespachado: despacho.porcentaje,
            estadoDespachoCode: despacho.estadoCode,
            estadoDespacho: estadoDespachoProductoTypeFactory(despacho.estadoCode).getForHumans(),
          };
        }),
      };
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private _calcularEstadoSolicitud(solicitudPedido: SolicitudPedidoOrm) {
    const estados = solicitudPedido.productos.map(producto => producto.estadoDespachoCode);

    if (estados.every(estado => estado === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode())) {
      return ESTADOS_SOLICITUD_PEDIDO.FACTURADO.getCode();
    }
    if (estados.every(estado => estado === ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode())) {
      return ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode();
    }
    return ESTADOS_SOLICITUD_PEDIDO.PARCIAL.getCode();
  }
}
