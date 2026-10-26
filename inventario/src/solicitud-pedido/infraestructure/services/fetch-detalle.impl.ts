import { Inject, Injectable } from '@nestjs/common';
import { In, IsNull, Not } from 'typeorm';

import { GCM_CONTEXTS, GcmContextCode, GcmContextType } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { INN_AUTHORITIES } from '@inn/authorities';
import {
  SolicitudPedidoHistorialOrm,
  SolicitudPedidoOrm,
  SolicitudPedidoProductoOrm,
  SolicitudPedidoSobrepedidoOrm,
} from '@inn/orm/inn/solicitud-pedido';
import {
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES,
} from '@inn/types/inn/solicitud-pedido';
import { contextoSolicitudPedidoFactory } from './contexto-solicitud-pedido.util';
import { ExistenciasDinamicaImpl, normalizarCodigoProducto } from './existencias-dinamica.impl';
import {
  agregarExistenciasAmmedical,
  FetchSolicitudPedidosImpl,
  transformToResponse,
} from './fetch.impl';
import {
  agregarReferenciasProductosEnOtrasSedes,
  SolicitudProductoOtraSedeReferencia,
} from './otras-sedes';
import { calcularCantidadPendienteProducto } from './sobrepedido-impacto';
import { cargarReferenciasDespacho } from './catalogo-referencias';

@Injectable()
export class FetchDetalleSolicitudPedidoImpl extends BaseSource {
  @Inject(FetchSolicitudPedidosImpl)
  private readonly _fetchSolicitudes: FetchSolicitudPedidosImpl;

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
      // 1. Consultar la solicitud base con relaciones ManyToOne (evita producto cartesiano)
      const solicitud = await qr.manager.getRepository(SolicitudPedidoOrm).findOne({
        where: { numeroSolicitud: numeroSolicitud.trim() },
        relations: ['creadoPor', 'sede'],
      });

      if (!solicitud) throw new Error('No existe la solicitud de pedido indicada');

      // 2. Consultar colecciones hijas en paralelo sin multiplicar filas entre tablas
      const [historial, productos, cierresSobrepedido, origenesSobrepedido] = await Promise.all([
        qr.manager.getRepository(SolicitudPedidoHistorialOrm).find({
          where: { solicitudPedidoId: solicitud.id },
          relations: ['usuario', 'sede'],
          order: { fechaCambio: 'DESC' },
        }),
        qr.manager.getRepository(SolicitudPedidoProductoOrm).find({
          where: { solicitudPedidoId: solicitud.id },
          relations: [
            'producto',
            'agrupamiento',
            'producto.agrupamiento',
            'despachos',
            'despachos.productoDespachado',
            'usuarioRechazo',
            'cierresSobrepedido',
            'cierresSobrepedido.solicitudNueva',
            'cierresSobrepedido.usuario',
          ],
        }),
        qr.manager.getRepository(SolicitudPedidoSobrepedidoOrm).find({
          where: { solicitudAnteriorId: solicitud.id },
          relations: ['solicitudNueva', 'usuario'],
        }),
        qr.manager.getRepository(SolicitudPedidoSobrepedidoOrm).find({
          where: { solicitudNuevaId: solicitud.id },
          relations: ['solicitudAnterior', 'usuario'],
        }),
      ]);

      solicitud.historial = historial;
      solicitud.productos = productos;
      solicitud.cierresSobrepedido = cierresSobrepedido;
      solicitud.origenesSobrepedido = origenesSobrepedido;

      await this._fetchSolicitudes.resolverUsuariosDespacho([solicitud]);
      const response = transformToResponse([solicitud], ctx);
      await cargarReferenciasDespacho(qr, response[0].productos);

      const codigosExistencias = response[0].productos.flatMap(producto =>
        producto.agrupamientoId
          ? producto.referencias.map(referencia => normalizarCodigoProducto(referencia.codigo))
          : [normalizarCodigoProducto(producto.codigo)]
      );

      const codigosOtrasSedes = esGestor
        ? response[0].productos.map(producto => producto.codigoAgrupamiento || producto.codigo)
        : [];

      // Ejecutar en paralelo la consulta de existencias en AMMedical y la consulta cruzada de otras sedes
      const [existencias, referenciasOtrasSedes] = await Promise.all([
        this._existenciasDinamica.obtenerPorCodigos(codigosExistencias),
        esGestor && codigosOtrasSedes.length
          ? this._buscarReferenciasOtrasSedes(codigosOtrasSedes)
          : Promise.resolve([]),
      ]);

      agregarExistenciasAmmedical(response, existencias);
      if (esGestor && referenciasOtrasSedes.length) {
        agregarReferenciasProductosEnOtrasSedes(response, referenciasOtrasSedes);
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

    // Consultar las 4 sedes en paralelo
    const resultadosPorContexto = await Promise.all(
      contextos.map(async (contexto) => {
        const qr = this.dynamicQR(contexto);
        try {
          await qr.connect();
          const productos = await qr.manager
            .createQueryBuilder(SolicitudPedidoProductoOrm, 'sp')
            .innerJoinAndSelect('sp.solicitudPedido', 'sol')
            .innerJoinAndSelect('sol.sede', 'sede')
            .innerJoinAndSelect('sp.producto', 'p')
            .leftJoinAndSelect('p.agrupamiento', 'p_agr')
            .leftJoinAndSelect('sp.agrupamiento', 'sp_agr')
            .where('sol.sedeId IS NOT NULL')
            .andWhere('sol.estadoCode NOT IN (:...estadosCerradosSol)', {
              estadosCerradosSol: ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES,
            })
            .andWhere('sp.estadoDespachoCode NOT IN (:...estadosCerradosProd)', {
              estadosCerradosProd: estadosCerradosProducto,
            })
            .andWhere(
              '(sp_agr.codigo IN (:...codigos) OR p_agr.codigo IN (:...codigos) OR p.codigo IN (:...codigos))',
              { codigos: codigosNormalizados },
            )
            .getMany();

          const refs: SolicitudProductoOtraSedeReferencia[] = [];
          productos.forEach(producto => {
            const codigo = normalizarCodigoProducto(
              producto.agrupamiento?.codigo ||
              producto.producto?.agrupamiento?.codigo ||
              producto.producto?.codigo
            );
            if (!codigosNormalizados.includes(codigo)) return;
            const cantidadPendiente = calcularCantidadPendienteProducto(producto);
            if (cantidadPendiente <= 0) return;

            refs.push({
              codigo,
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

          return refs;
        } finally {
          await qr.release();
        }
      })
    );

    return resultadosPorContexto.flat();
  }
}
