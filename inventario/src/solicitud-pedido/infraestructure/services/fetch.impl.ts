import { Injectable } from '@nestjs/common';
import { Between, In, IsNull, Not } from 'typeorm';

import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';
import { ProductoOrm as ProductoExistenciaOrm } from '@inn/orm/inn/productos/inn';
import {
  calcularEstadoDespachoProducto,
  esSolicitudPedidoCerrada,
  estadoDespachoProductoTypeFactory,
  estadoProductosTypeFactory,
  EstadoSolicitudPedidoCode,
  estadoSolicitudPedidoTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
} from '@inn/types/inn/solicitud-pedido';
import { INN_AUTHORITIES } from '@inn/authorities';

@Injectable()
export class FetchSolicitudPedidosImpl extends BaseSource {
  public async execute(fechaInicio: Date, fechaFin: Date) {
    const showAllContext = await this.hasAnyAuthority([
      INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO,
    ]);

    const ctxs = showAllContext
      ? [
          GCM_CONTEXTS.ALTACENTRO,
          GCM_CONTEXTS.VALLEDUPAR,
          GCM_CONTEXTS.SANJUAN,
          GCM_CONTEXTS.AGUACHICA,
        ]
      : [this.auth.context];

    const CTX_AMMEDICAL = GCM_CONTEXTS.AMMEDICAL;

    const response: ReturnType<typeof transformToResponse> = [];

    for (let index = 0; index < ctxs.length; index++) {
      const el = ctxs[index];
      const qr = this.dynamicQR(el);

      try {
        await qr.connect();

        const solicitudPedidoRp = qr.manager.getRepository(SolicitudPedidoOrm);

        const SolicitudPedidos = await solicitudPedidoRp.find({
          where: {
            fechaCreacion: Between(fechaInicio, fechaFin),
            sedeId: Not(IsNull()),
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

        response.push(...transformToResponse(SolicitudPedidos, el));
      } catch (error: any) {
        throw new Error(`Error consultando ${el.getCode()}: ${error.message}`);
      } finally {
        await qr.release();
      }
    }

    const codigosProductos = [
      ...new Set(
        response.flatMap(solicitud =>
          solicitud.productos.map(producto => normalizarCodigoProducto(producto.codigo))
        )
      ),
    ].filter(Boolean);
    const existenciasAmmedical = await this.fetchExistenciasAmmedical(
      codigosProductos,
      CTX_AMMEDICAL
    );

    agregarExistenciasAmmedical(response, existenciasAmmedical);
    agregarSolicitudesEnOtrasSedes(response);

    return response.sort(
      (primeraSolicitud, segundaSolicitud) =>
        new Date(segundaSolicitud.fechaCreacion).getTime() -
        new Date(primeraSolicitud.fechaCreacion).getTime()
    );
  }

  private async fetchExistenciasAmmedical(
    codigosProductos: string[],
    context: GcmContextType
  ): Promise<Map<string, ExistenciaAmmedical>> {
    const existencias = new Map<string, ExistenciaAmmedical>();
    if (!codigosProductos.length) return existencias;

    const qr = this.dynamicQR(context);

    try {
      await qr.connect();

      // SQL Server permite como maximo 2.100 parametros por consulta.
      const cantidadPorLote = 1000;
      for (let inicio = 0; inicio < codigosProductos.length; inicio += cantidadPorLote) {
        const codigosLote = codigosProductos.slice(inicio, inicio + cantidadPorLote);
        const productos = await qr.manager.getRepository(ProductoExistenciaOrm).find({
          where: { codigo: In(codigosLote) },
          relations: { existencias: true },
        });

        productos.forEach(producto => {
          const codigo = normalizarCodigoProducto(producto.codigo);
          const cantidad = (producto.existencias ?? []).reduce(
            (total, existencia) => total + Number(existencia.cantidad ?? 0),
            0
          );
          const existenciaActual = existencias.get(codigo);

          existencias.set(codigo, {
            cantidad: (existenciaActual?.cantidad ?? 0) + cantidad,
            productoEncontrado: true,
          });
        });
      }

      return existencias;
    } catch (error: any) {
      throw new Error(`Error consultando existencias en ${context.getCode()}: ${error.message}`);
    } finally {
      await qr.release();
    }
  }
}

interface ExistenciaAmmedical {
  cantidad: number;
  productoEncontrado: boolean;
}

export interface SolicitudProductoOtraSedeResponse {
  solicitudPedidoId: number;
  numeroSolicitud: string;
  contextCode: string;
  sede: {
    id: number;
    codigo: string;
    nombre: string;
  };
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadPendiente: number;
  estadoDespachoCode: number;
}

const normalizarCodigoProducto = (codigo: string): string => codigo?.trim().toUpperCase() ?? '';

const agregarExistenciasAmmedical = (
  solicitudes: ReturnType<typeof transformToResponse>,
  existencias: Map<string, ExistenciaAmmedical>
): void => {
  solicitudes.forEach(solicitud => {
    solicitud.productos.forEach(producto => {
      const existencia = existencias.get(normalizarCodigoProducto(producto.codigo));
      producto.existenciaAmmedical = existencia?.cantidad ?? 0;
      producto.productoExisteEnAmmedical = existencia?.productoEncontrado ?? false;
    });
  });
};

export const agregarSolicitudesEnOtrasSedes = (
  solicitudes: ReturnType<typeof transformToResponse>
): void => {
  const solicitudesPorProducto = new Map<
    string,
    Array<SolicitudProductoOtraSedeResponse & { sedeKey: string }>
  >();

  solicitudes.forEach(solicitud => {
    if (esSolicitudPedidoCerrada(solicitud.estadoCode)) return;

    const sedeKey = `${solicitud.contextCode}:${solicitud.sede.id}`;

    solicitud.productos.forEach(producto => {
      if (
        producto.cantidadPendiente <= 0 ||
        producto.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode()
      ) {
        return;
      }

      const codigo = normalizarCodigoProducto(producto.codigo);
      if (!codigo) return;

      const referencias = solicitudesPorProducto.get(codigo) ?? [];
      referencias.push({
        solicitudPedidoId: solicitud.id,
        numeroSolicitud: solicitud.numeroSolicitud,
        contextCode: solicitud.contextCode,
        sede: {
          id: solicitud.sede.id,
          codigo: solicitud.sede.codigo,
          nombre: solicitud.sede.nombre,
        },
        cantidadSolicitada: producto.cantidadSolicitada,
        cantidadEnviada: producto.cantidadEnviada,
        cantidadPendiente: producto.cantidadPendiente,
        estadoDespachoCode: producto.estadoDespachoCode,
        sedeKey,
      });
      solicitudesPorProducto.set(codigo, referencias);
    });
  });

  solicitudes.forEach(solicitud => {
    const solicitudCerrada = esSolicitudPedidoCerrada(solicitud.estadoCode);
    const sedeKey = `${solicitud.contextCode}:${solicitud.sede.id}`;

    solicitud.productos.forEach(producto => {
      const productoCerrado =
        solicitudCerrada ||
        producto.cantidadPendiente <= 0 ||
        producto.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode();

      if (productoCerrado) {
        producto.solicitadoEnOtrasSedes = false;
        producto.cantidadPendienteOtrasSedes = 0;
        producto.solicitudesOtrasSedes = [];
        return;
      }

      const codigo = normalizarCodigoProducto(producto.codigo);
      const solicitudesOtrasSedes = (solicitudesPorProducto.get(codigo) ?? [])
        .filter(referencia => referencia.sedeKey !== sedeKey)
        .map(({ sedeKey: _sedeKey, ...referencia }) => referencia);

      producto.solicitadoEnOtrasSedes = solicitudesOtrasSedes.length > 0;
      producto.cantidadPendienteOtrasSedes = solicitudesOtrasSedes.reduce(
        (total, referencia) => total + referencia.cantidadPendiente,
        0
      );
      producto.solicitudesOtrasSedes = solicitudesOtrasSedes;
    });

    solicitud.tieneProductosSolicitadosEnOtrasSedes = solicitud.productos.some(
      producto => producto.solicitadoEnOtrasSedes
    );
  });
};

const transformToResponse = (data: SolicitudPedidoOrm[], context: GcmContextType) => {
  const response = data.map(item => {
    return {
      id: item.id,
      numeroSolicitud: item.numeroSolicitud,
      contextCode: context.getCode(),
      fechaCreacion: item.fechaCreacion,
      estadoCode: item.estadoCode,
      estado: estadoSolicitudPedidoTypeFactory(
        item.estadoCode as EstadoSolicitudPedidoCode
      ).getForHumans(),
      hasVisto: item.hasVisto,
      obervacionRechazo: item.obervacionRechazo,
      sede: item.sede,
      creadoPor: item.creadoPor,
      historial: item.historial,
      tieneProductosSolicitadosEnOtrasSedes: false,
      productos: item.productos.map(detalle => {
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
          descripcion: detalle.producto.descripcionLarga,
          prioridadCode: detalle.estadoCode,
          prioridad: estadoProductosTypeFactory(detalle.estadoCode).getForHumans(),
          cantidadSolicitada,
          cantidadEnviada,
          cantidadPendiente: productoFacturado
            ? 0
            : Math.max(0, cantidadSolicitada - cantidadEnviada),
          porcentajeDespachado: despacho.porcentaje,
          estadoDespachoCode: despacho.estadoCode,
          estadoDespacho: estadoDespachoProductoTypeFactory(despacho.estadoCode).getForHumans(),
          existenciaAmmedical: 0,
          productoExisteEnAmmedical: false,
          solicitadoEnOtrasSedes: false,
          cantidadPendienteOtrasSedes: 0,
          solicitudesOtrasSedes: [] as SolicitudProductoOtraSedeResponse[],
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
