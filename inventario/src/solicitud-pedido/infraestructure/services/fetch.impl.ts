import { Inject, Injectable } from '@nestjs/common';
import { Between, In, IsNull, Not } from 'typeorm';

import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudPedidoOrm } from '@inn/orm/inn/solicitud-pedido';
import {
  calcularEstadoDespachoProducto,
  esSolicitudPedidoCerrada,
  estadoDespachoProductoTypeFactory,
  estadoProductosTypeFactory,
  EstadoSolicitudPedidoCode,
  estadoSolicitudPedidoTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { INN_AUTHORITIES } from '@inn/authorities';
import {
  ExistenciaDinamica,
  ExistenciasDinamicaImpl,
  normalizarCodigoProducto,
} from './existencias-dinamica.impl';
import {
  agregarReferenciasProductosEnOtrasSedes,
  SolicitudProductoOtraSedeReferencia,
  SolicitudProductoOtraSedeResponse,
} from './otras-sedes';
import { UsuarioOrm } from '@inn/orm/gen';
import { cargarReferenciasDespacho, ReferenciaDespachoResponse } from './catalogo-referencias';

@Injectable()
export class FetchSolicitudPedidosImpl extends BaseSource {
  @Inject(ExistenciasDinamicaImpl)
  private readonly _existenciasDinamica: ExistenciasDinamicaImpl;

  public async findUsuariosAM(ids: number[]): Promise<Map<number, UsuarioOrm>> {
    const mapa = new Map<number, UsuarioOrm>();
    const idsValidos = [...new Set(ids)].filter(id => Number.isInteger(id) && id > 0);
    if (!idsValidos.length) return mapa;

    const ctx = GCM_CONTEXTS.AMMEDICAL;
    const qr = this.dynamicQR(ctx);
    try {
      await qr.connect();
      const batchSize = 1000;
      for (let i = 0; i < idsValidos.length; i += batchSize) {
        const batch = idsValidos.slice(i, i + batchSize);
        const usuarios = await qr.manager.getRepository(UsuarioOrm).find({
          where: { id: In(batch) },
        });
        usuarios.forEach(u => mapa.set(u.id, u));
      }
      return mapa;
    } catch (error: any) {
      throw new Error(`Error consultando usuarios en AMMedical: ${error.message}`);
    } finally {
      await qr.release();
    }
  }

  public async findUsuarioAM(id: number): Promise<UsuarioOrm | null> {
    const mapa = await this.findUsuariosAM([id]);
    return mapa.get(id) ?? null;
  }

  public async resolverUsuariosDespacho(solicitudes: SolicitudPedidoOrm[]): Promise<void> {
    const idsPendientes = new Set<number>();
    for (const solicitud of solicitudes) {
      for (const producto of solicitud.productos ?? []) {
        for (const despacho of producto.despachos ?? []) {
          if (despacho.usuarioId) {
            idsPendientes.add(despacho.usuarioId);
          }
        }
      }
    }
    if (!idsPendientes.size) return;
    const usuarios = await this.findUsuariosAM([...idsPendientes]);
    for (const solicitud of solicitudes) {
      for (const producto of solicitud.productos ?? []) {
        for (const despacho of producto.despachos ?? []) {
          despacho.usuario = usuarios.get(despacho.usuarioId) ?? null;
        }
      }
    }
  }

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

    const resultadosPorContexto = await Promise.all(
      ctxs.map(async el => {
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
              'sede',
              'productos',
              'productos.producto',
              'productos.agrupamiento',
              'productos.despachos',
              'productos.despachos.productoDespachado',
              'productos.usuarioRechazo',
            ],
            order: { fechaCreacion: 'DESC' },
          });

          return { SolicitudPedidos, context: el };
        } catch (error: any) {
          throw new Error(`Error consultando ${el.getCode()}: ${error.message}`);
        } finally {
          await qr.release();
        }
      })
    );

    // Resolver en un único batch optimizado los usuarios de despacho de todas las sedes
    const todasLasSolicitudesOrm: SolicitudPedidoOrm[] = [];
    for (const { SolicitudPedidos } of resultadosPorContexto) {
      todasLasSolicitudesOrm.push(...SolicitudPedidos);
    }
    await this.resolverUsuariosDespacho(todasLasSolicitudesOrm);

    const response: ReturnType<typeof transformToResponse> = [];
    for (const { SolicitudPedidos, context } of resultadosPorContexto) {
      response.push(...transformToResponse(SolicitudPedidos, context));
    }

    return response.sort(
      (primeraSolicitud, segundaSolicitud) =>
        new Date(segundaSolicitud.fechaCreacion).getTime() -
        new Date(primeraSolicitud.fechaCreacion).getTime()
    );
  }
}

export const agregarExistenciasAmmedical = (
  solicitudes: ReturnType<typeof transformToResponse>,
  existencias: Map<string, ExistenciaDinamica>
): void => {
  solicitudes.forEach(solicitud => {
    solicitud.productos.forEach(producto => {
      if (producto.agrupamientoId) {
        producto.referencias.forEach(referencia => {
          const stock = existencias.get(normalizarCodigoProducto(referencia.codigo));
          referencia.existenciaDinamica = stock?.cantidad ?? 0;
          referencia.productoEncontrado = stock?.productoEncontrado ?? false;
        });
        producto.existenciaAmmedical = producto.referencias.reduce(
          (total, referencia) => total + referencia.existenciaDinamica,
          0
        );
        producto.productoExisteEnAmmedical = producto.referencias.some(
          referencia => referencia.productoEncontrado
        );
        return;
      }
      const existencia = existencias.get(normalizarCodigoProducto(producto.codigo));
      producto.existenciaAmmedical = existencia?.cantidad ?? 0;
      producto.productoExisteEnAmmedical = existencia?.productoEncontrado ?? false;
    });
  });
};

export const agregarSolicitudesEnOtrasSedes = (
  solicitudes: ReturnType<typeof transformToResponse>
): void => {
  const referencias: SolicitudProductoOtraSedeReferencia[] = [];

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

      const codigo = normalizarCodigoProducto(producto.codigoAgrupamiento || producto.codigo);
      if (!codigo) return;

      referencias.push({
        codigo,
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
    });
  });

  agregarReferenciasProductosEnOtrasSedes(solicitudes, referencias);
};

export const transformToResponse = (data: SolicitudPedidoOrm[], context: GcmContextType) => {
  const response = data.map(item => {
    const productos = item.productos.map(detalle => {
      const cantidadSolicitada = Number(detalle.cantidad);
      const cantidadEnviada = Number(detalle.cantidadEnviada ?? 0);
      const cantidadRechazada = Number(detalle.cantidadRechazada ?? 0);
      const cantidadSobrepedido = Number(detalle.cantidadSobrepedido ?? 0);
      const productoFacturado =
        detalle.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode();
      const productoRechazado =
        detalle.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode();
      const productoSobrepedido =
        detalle.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode();
      const despachoCalculado = calcularEstadoDespachoProducto(cantidadSolicitada, cantidadEnviada);
      const despacho = productoFacturado
        ? {
            estadoCode: ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode(),
            porcentaje: 100,
          }
        : productoRechazado || productoSobrepedido
          ? {
              estadoCode: detalle.estadoDespachoCode,
              porcentaje: Number(((cantidadEnviada / cantidadSolicitada) * 100).toFixed(2)),
            }
          : despachoCalculado;

      return {
        id: detalle.id,
        productoId: detalle.productoId,
        agrupamientoId: detalle.agrupamientoId ?? null,
        codigoAgrupamiento:
          detalle.agrupamiento?.codigo?.trim() ||
          detalle.producto.agrupamiento?.codigo?.trim() ||
          null,
        referencias: [] as ReferenciaDespachoResponse[],
        codigo: detalle.agrupamiento?.codigo?.trim() || detalle.producto.codigo,
        descripcion:
          detalle.agrupamiento?.nombre?.trim() ||
          detalle.agrupamiento?.codigo?.trim() ||
          detalle.producto.descripcionLarga?.trim() ||
          detalle.producto.descripcionCorta?.trim() ||
          detalle.producto.codigo?.trim() ||
          '',
        codigoSub: detalle.producto.codigoSub == null ? null : Number(detalle.producto.codigoSub),
        tipo:
          Number(detalle.producto.tipoCode) === 1
            ? 'SUMINISTRO'
            : Number(detalle.producto.tipoCode) === 2
              ? 'MEDICAMENTO'
              : null,
        prioridadCode: detalle.estadoCode,
        prioridad: estadoProductosTypeFactory(detalle.estadoCode).getForHumans(),
        cantidadSolicitada,
        cantidadEnviada,
        cantidadRechazada,
        cantidadSobrepedido,
        cantidadPendiente:
          productoFacturado || productoRechazado || productoSobrepedido
            ? 0
            : Math.max(
                0,
                cantidadSolicitada - cantidadEnviada - cantidadRechazada - cantidadSobrepedido
              ),
        porcentajeDespachado: despacho.porcentaje,
        estadoDespachoCode: despacho.estadoCode,
        estadoDespacho: estadoDespachoProductoTypeFactory(despacho.estadoCode).getForHumans(),
        existenciaAmmedical: 0,
        productoExisteEnAmmedical: false,
        observacionRechazo: detalle.observacionRechazo?.trim() || null,
        fechaRechazo: detalle.fechaRechazo ?? null,
        usuarioRechazo: detalle.usuarioRechazo ?? null,
        cierreSobrepedido: detalle.cierresSobrepedido?.[0]
          ? {
              tipoCierre: detalle.cierresSobrepedido[0].tipoCierre,
              cantidadCerrada: Number(detalle.cierresSobrepedido[0].cantidadCerrada),
              observacion: detalle.cierresSobrepedido[0].observacion,
              fechaCreacion: detalle.cierresSobrepedido[0].fechaCreacion,
              usuario: detalle.cierresSobrepedido[0].usuario ?? null,
              solicitudRelacionada: {
                id: detalle.cierresSobrepedido[0].solicitudNueva.id,
                numeroSolicitud: detalle.cierresSobrepedido[0].solicitudNueva.numeroSolicitud,
              },
            }
          : null,
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
          .map(movimiento => {
            // Solo los movimientos heredados sin ID corresponden al hijo original.
            const referencia =
              movimiento.productoDespachadoId == null
                ? detalle.producto
                : movimiento.productoDespachado;
            return {
              id: movimiento.id,
              productoDespachadoId: movimiento.productoDespachadoId ?? detalle.productoId,
              codigoDespachado: referencia?.codigo?.trim() || '',
              descripcionDespachada:
                referencia?.descripcionLarga?.trim() ||
                referencia?.descripcionCorta?.trim() ||
                referencia?.codigo?.trim() ||
                '',
              cantidadEnviada: Number(movimiento.cantidad),
              cantidadAcumulada: Number(movimiento.cantidadAcumulada),
              estadoDespachoCode: movimiento.estadoDespachoCode,
              estadoDespacho: estadoDespachoProductoTypeFactory(
                movimiento.estadoDespachoCode
              ).getForHumans(),
              observacion: movimiento.observacion ?? null,
              fechaCreacion: movimiento.fechaCreacion,
              usuario: movimiento.usuario,
            };
          }),
      };
    });
    const tieneRechazos = productos.some(
      producto => producto.estadoDespachoCode === ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode()
    );
    const cierreSobrepedido = item.cierresSobrepedido?.[0];
    const solicitudesAnteriores = [
      ...new Map(
        (item.origenesSobrepedido ?? []).map(origen => [
          origen.solicitudAnteriorId,
          {
            id: origen.solicitudAnteriorId,
            numeroSolicitud: origen.solicitudAnterior.numeroSolicitud,
          },
        ])
      ).values(),
    ];

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
      observacionRechazo: item.obervacionRechazo,
      tieneRechazos,
      sobrepedido: {
        nuevaSolicitud: cierreSobrepedido
          ? {
              id: cierreSobrepedido.solicitudNuevaId,
              numeroSolicitud: cierreSobrepedido.solicitudNueva.numeroSolicitud,
            }
          : null,
        solicitudesAnteriores,
        observacion:
          cierreSobrepedido?.observacion ?? item.origenesSobrepedido?.[0]?.observacion ?? null,
        fecha:
          cierreSobrepedido?.fechaCreacion ?? item.origenesSobrepedido?.[0]?.fechaCreacion ?? null,
        usuario: cierreSobrepedido?.usuario ?? item.origenesSobrepedido?.[0]?.usuario ?? null,
        esRegistroHeredado:
          item.estadoCode === ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode() && !cierreSobrepedido,
      },
      sede: item.sede,
      creadoPor: item.creadoPor,
      historial: item.historial ?? [],
      tieneProductosSolicitadosEnOtrasSedes: false,
      productos,
    };
  });

  return response;
};
