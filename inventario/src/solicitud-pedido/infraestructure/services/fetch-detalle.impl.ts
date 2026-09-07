import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';

import { GCM_CONTEXTS, GcmContextCode, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/authorities';
import { SolicitudPedidoOrm, SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import {
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES,
} from '@inn/types/inn/solicitud-pedido';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import { ExistenciasDinamicaImpl, normalizarCodigoProducto } from './existencias-dinamica.impl';
import { agregarExistenciasAmmedical, transformToResponse } from './fetch.impl';
import {
  agregarReferenciasProductosEnOtrasSedes,
  SolicitudProductoOtraSedeReferencia,
} from './otras-sedes';
import { calcularCantidadPendienteProducto } from './sobrepedido-impacto';

@Injectable()
export class FetchDetalleSolicitudPedidoImpl extends BaseSource {
  @Inject(ExistenciasDinamicaImpl)
  private readonly _existenciasDinamica: ExistenciasDinamicaImpl;

  async execute(contextCode: GcmContextCode, numeroSolicitud: string) {
    const ctx = contextoSolicitudPedidoFactory(contextCode);
    const esGestor = await this.hasAnyAuthority([INN_AUTHORITIES.SOLICITUD_PEDIDO.FACTURAR_PEDIDO]);

    if (!esGestor && this.auth.context.getCode() !== ctx.getCode()) {
      throw new Error('No tiene permisos para consultar solicitudes de este contexto');
    }
    if (!numeroSolicitud?.trim()) throw new Error('Debe enviar un numero de solicitud valido');

    const qr = this.dynamicQR(ctx);
    try {
      await qr.connect();
      const solicitud = await qr.manager.getRepository(SolicitudPedidoOrm).findOne({
        where: { numeroSolicitud: numeroSolicitud.trim() },
        relations: [
          'creadoPor',
          'historial',
          'historial.usuario',
          'historial.sede',
          'sede',
          'productos',
          'productos.producto',
          'productos.despachos',
          'productos.despachos.usuario',
          'productos.usuarioRechazo',
          'productos.cierresSobrepedido',
          'productos.cierresSobrepedido.solicitudNueva',
          'productos.cierresSobrepedido.usuario',
          'cierresSobrepedido',
          'cierresSobrepedido.solicitudNueva',
          'cierresSobrepedido.usuario',
          'origenesSobrepedido',
          'origenesSobrepedido.solicitudAnterior',
          'origenesSobrepedido.usuario',
        ],
        order: { historial: { fechaCambio: 'DESC' } },
      });

      if (!solicitud) throw new Error('No existe la solicitud de pedido indicada');

      const response = transformToResponse([solicitud], ctx);
      const codigos = response[0].productos.map(producto =>
        normalizarCodigoProducto(producto.codigo)
      );
      const existencias = await this._existenciasDinamica.obtenerPorCodigos(codigos);
      agregarExistenciasAmmedical(response, existencias);
      if (esGestor) {
        const referencias = await this._buscarReferenciasOtrasSedes(codigos);
        agregarReferenciasProductosEnOtrasSedes(response, referencias);
      }

      return response[0];
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private async _buscarReferenciasOtrasSedes(
    codigos: string[]
  ): Promise<SolicitudProductoOtraSedeReferencia[]> {
    const codigosNormalizados = [...new Set(codigos.map(normalizarCodigoProducto))].filter(Boolean);
    if (!codigosNormalizados.length) return [];

    const contextos: GcmContextType[] = [
      GCM_CONTEXTS.ALTACENTRO,
      GCM_CONTEXTS.VALLEDUPAR,
      GCM_CONTEXTS.SANJUAN,
      GCM_CONTEXTS.AGUACHICA,
    ];
    const estadosCerradosProducto = [
      ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode(),
      ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode(),
      ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode(),
    ];
    const referencias: SolicitudProductoOtraSedeReferencia[] = [];

    for (const contexto of contextos) {
      const qr = this.dynamicQR(contexto);
      try {
        await qr.connect();
        const productos = await qr.manager.getRepository(SolicitudPedidoProductoOrm).find({
          where: {
            estadoDespachoCode: Not(In(estadosCerradosProducto)),
            producto: { codigo: In(codigosNormalizados) },
            solicitudPedido: {
              sedeId: Not(IsNull()),
              estadoCode: Not(In(ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES)),
            },
          },
          relations: ['producto', 'solicitudPedido', 'solicitudPedido.sede'],
        });

        productos.forEach(producto => {
          const cantidadPendiente = calcularCantidadPendienteProducto(producto);
          if (cantidadPendiente <= 0) return;

          referencias.push({
            codigo: normalizarCodigoProducto(producto.producto.codigo),
            sedeKey: `${contexto.getCode()}:${producto.solicitudPedido.sede.id}`,
            solicitudPedidoId: producto.solicitudPedido.id,
            numeroSolicitud: producto.solicitudPedido.numeroSolicitud,
            contextCode: contexto.getCode(),
            sede: {
              id: producto.solicitudPedido.sede.id,
              codigo: producto.solicitudPedido.sede.codigo,
              nombre: producto.solicitudPedido.sede.nombre,
            },
            cantidadSolicitada: Number(producto.cantidad),
            cantidadEnviada: Number(producto.cantidadEnviada ?? 0),
            cantidadPendiente,
            estadoDespachoCode: producto.estadoDespachoCode,
          });
        });
      } finally {
        await qr.release();
      }
    }

    return referencias;
  }
}
