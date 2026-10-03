import { Injectable } from '@nestjs/common';
import { In, Not } from 'typeorm';

import { BaseSource } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { ProductoOrm } from '@inn/orm/inn/productos';
import { SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import { obtenerConfiguracionReporte } from './reporte-configuracion';
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
  existenciaActual: number;
}

@Injectable()
export class BuscarProductoImpl extends BaseSource {
  public async execute(codigo: string, sedeId: number): Promise<BuscarProductoResponse> {
    if (!Number.isInteger(sedeId) || sedeId <= 0) {
      throw new Error('Debe enviar una sede valida');
    }

    const ctx = gcmContextFactory(this.auth.context.getCode());
    const { almacenes } = obtenerConfiguracionReporte(ctx.getCode(), sedeId);

    const qr = this.dynamicQR(ctx);

    try {
      await qr.connect();
      const productoRp = qr.manager.getRepository(ProductoOrm);
      const producto = await productoRp.findOne({
        where: { codigo },
      });

      if (!producto) throw new Error('No existe producto con este código');

      const filtroAlmacenes = almacenes
        ? ` AND A.OID IN (${almacenes.map((_, index) => `@${index + 2}`).join(', ')})`
        : '';
      const [stock] = await qr.query(
        `SELECT COALESCE(SUM(F.IFICANTID), 0) AS existenciaActual
         FROM INNFISICO F
         INNER JOIN INNALMACE A ON A.OID = F.INNALMACE
         WHERE F.INNPRODUC = @0 AND A.ACACODIGO = @1${filtroAlmacenes}`,
        [producto.id, sedeId, ...(almacenes ?? [])]
      );
      const existenciaActual = Number(stock?.existenciaActual);
      if (stock?.existenciaActual == null || !Number.isFinite(existenciaActual)) {
        throw new Error('No fue posible consultar la existencia actual del producto');
      }

      const solicitudProductoRp = qr.manager.getRepository(SolicitudPedidoProductoOrm);
      const productosPendientes = await solicitudProductoRp.find({
        where: {
          productoId: producto.id,
          estadoDespachoCode: Not(
            In([
              ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode(),
              ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode(),
              ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode(),
            ])
          ),
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
              detalle =>
                calcularCantidadPendiente(
                  detalle.cantidad,
                  detalle.cantidadEnviada,
                  detalle.cantidadRechazada,
                  detalle.cantidadSobrepedido
                ) > 0
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
                  detalle.cantidadEnviada,
                  detalle.cantidadRechazada,
                  detalle.cantidadSobrepedido
                ),
              },
            ])
        ).values(),
      ];

      return {
        id: producto.id,
        codigo: producto.codigo,
        descripcion:
          producto.descripcionLarga?.trim() ||
          producto.descripcionCorta?.trim() ||
          producto.codigo?.trim() ||
          '',
        existenciaActual,
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

const calcularCantidadPendiente = (
  cantidadSolicitada: number,
  cantidadEnviada?: number,
  cantidadRechazada?: number,
  cantidadSobrepedido?: number
): number =>
  Number(
    Math.max(
      0,
      Number(cantidadSolicitada) -
        Number(cantidadEnviada ?? 0) -
        Number(cantidadRechazada ?? 0) -
        Number(cantidadSobrepedido ?? 0)
    ).toFixed(4)
  );
