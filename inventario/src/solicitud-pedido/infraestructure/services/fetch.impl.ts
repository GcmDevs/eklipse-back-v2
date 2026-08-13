import { Injectable } from '@nestjs/common';
import { Between, IsNull } from 'typeorm';

import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/authorities';
import { SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';
import {
  calcularEstadoDespachoProducto,
  estadoDespachoProductoTypeFactory,
  estadoProductosTypeFactory,
} from '@inn/types/inn/solicitud-pedido';

@Injectable()
export class FetchSolicitudPedidosImpl extends BaseSource {
  public async execute(fechaInicio: Date, fechaFin: Date) {
    const showAllContext = await this.hasAnyAuthority([
      INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO,
    ]);

    const ctxs = showAllContext ? [GCM_CONTEXTS.ALTACENTRO] : [this.auth.context];

    for (let index = 0; index < ctxs.length; index++) {
      const el = ctxs[index];
      const qr = this.dynamicQR(el);

      try {
        await qr.connect();

        const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);

        const SolicitudPedidos = await solicitudPedidoRp.find({
          where: {
            fechaCreacion: Between(fechaInicio, fechaFin),
            sede: !IsNull(),
          },
          relations: [
            'creadoPor',
            'historial',
            'historial.usuario',
            'sede',
            'historial.sede',
            'productos',
            'productos.producto',
            'productos.despachos',
            'productos.despachos.usuario',
          ],
          order: { fechaCreacion: 'DESC', historial: { fechaCambio: 'DESC' } },
        });

        const response = transformToResponse(SolicitudPedidos, el);

        return response;
      } catch (error: any) {
        throw new Error(error.message);
      } finally {
        await qr.release();
      }
    }
  }
}

const transformToResponse = (data: SolicitudPedidoOrm[], context: GcmContextType) => {
  const response = data.map(item => {
    return {
      id: item.id,
      numeroSolicitud: item.numeroSolicitud,
      contextCode: context.getCode(),
      fechaCreacion: item.fechaCreacion,
      estadoCode: item.estadoCode,
      hasVisto: item.hasVisto,
      obervacionRechazo: item.obervacionRechazo,
      sede: item.sede,
      creadoPor: item.creadoPor,
      historial: item.historial,
      productos: item.productos.map(detalle => {
        const cantidadSolicitada = Number(detalle.cantidad);
        const cantidadEnviada = Number(detalle.cantidadEnviada ?? 0);
        const despacho = calcularEstadoDespachoProducto(cantidadSolicitada, cantidadEnviada);

        return {
          id: detalle.id,
          productoId: detalle.productoId,
          codigo: detalle.producto.codigo,
          descripcion: detalle.producto.descripcionLarga,
          prioridadCode: detalle.estadoCode,
          prioridad: estadoProductosTypeFactory(detalle.estadoCode).getForHumans(),
          cantidadSolicitada,
          cantidadEnviada,
          cantidadPendiente: Math.max(0, cantidadSolicitada - cantidadEnviada),
          porcentajeDespachado: despacho.porcentaje,
          estadoDespachoCode: despacho.estadoCode,
          estadoDespacho: estadoDespachoProductoTypeFactory(despacho.estadoCode).getForHumans(),
          // Compatibilidad temporal con el contrato anterior.
          estadoCode: detalle.estadoCode,
          cantidad: cantidadSolicitada,
          despachos: [...(detalle.despachos ?? [])]
            .sort(
              (primerDespacho, segundoDespacho) =>
                segundoDespacho.fechaCreacion.getTime() - primerDespacho.fechaCreacion.getTime()
            )
            .map(movimiento => ({
              id: movimiento.id,
              cantidadEnviada: Number(movimiento.cantidad),
              cantidadAcumulada: Number(movimiento.cantidadAcumulada),
              estadoDespachoCode: movimiento.estadoDespachoCode,
              estadoDespacho: estadoDespachoProductoTypeFactory(
                movimiento.estadoDespachoCode
              ).getForHumans(),
              observacion: movimiento.observacion ?? null,
              fechaCreacion: movimiento.fechaCreacion,
              usuario: movimiento.usuario,
            })),
        };
      }),
    };
  });

  return response;
};
