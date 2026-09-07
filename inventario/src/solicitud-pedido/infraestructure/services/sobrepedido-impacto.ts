import { createHash } from 'crypto';
import { In, Not, Repository } from 'typeorm';

import { SolicitudPedidoOrm, SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import {
  estadoDespachoProductoTypeFactory,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES,
} from '@inn/types/inn/solicitud-pedido';

export type TipoImpactoSobrepedido = 'REEMPLAZADO' | 'CERRADO_SIN_TRASLADO';

export interface ProductoImpactoSobrepedido {
  solicitudPedidoProductoId: number;
  productoId: number;
  codigo: string;
  descripcion: string;
  estadoDespachoCode: number;
  estadoDespacho: string;
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadRechazada: number;
  cantidadSobrepedido: number;
  cantidadPendiente: number;
  afectado: boolean;
  tipoCierre: TipoImpactoSobrepedido | null;
}

export interface SolicitudImpactoSobrepedido {
  solicitudPedidoId: number;
  numeroSolicitud: string;
  sedeId: number;
  sede: string;
  productos: ProductoImpactoSobrepedido[];
}

export interface ImpactoSobrepedidoResponse {
  versionImpactoSobrepedido: string | null;
  solicitudes: SolicitudImpactoSobrepedido[];
  totalSolicitudes: number;
  totalProductosCerrados: number;
  totalCantidadCerrada: number;
}

export const calcularCantidadPendienteProducto = (
  producto: Pick<
    SolicitudPedidoProductoOrm,
    'cantidad' | 'cantidadEnviada' | 'cantidadRechazada' | 'cantidadSobrepedido'
  >
): number =>
  Number(
    Math.max(
      0,
      Number(producto.cantidad) -
        Number(producto.cantidadEnviada ?? 0) -
        Number(producto.cantidadRechazada ?? 0) -
        Number(producto.cantidadSobrepedido ?? 0)
    ).toFixed(4)
  );

export const buscarSolicitudesImpactadas = async (
  solicitudRp: Repository<SolicitudPedidoOrm>,
  productoRp: Repository<SolicitudPedidoProductoOrm>,
  sedeId: number,
  productoIds: number[],
  bloquear = false
): Promise<SolicitudPedidoOrm[]> => {
  const estadosCerradosProducto = [
    ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode(),
    ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode(),
    ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode(),
  ];
  const coincidencias = await productoRp.find({
    where: {
      productoId: In(productoIds),
      estadoDespachoCode: Not(In(estadosCerradosProducto)),
      solicitudPedido: {
        sedeId,
        estadoCode: Not(In(ESTADOS_SOLICITUD_PEDIDO_CERRADOS_CODES)),
      },
    },
    relations: ['solicitudPedido'],
    order: { solicitudPedido: { fechaCreacion: 'ASC' }, id: 'ASC' },
    ...(bloquear ? { lock: { mode: 'pessimistic_write' as const } } : {}),
  });
  const solicitudIds = [
    ...new Set(
      coincidencias
        .filter(producto => calcularCantidadPendienteProducto(producto) > 0)
        .map(producto => producto.solicitudPedidoId)
    ),
  ];
  if (!solicitudIds.length) return [];

  return solicitudRp.find({
    where: { id: In(solicitudIds) },
    relations: ['sede', 'productos', 'productos.producto'],
    order: { fechaCreacion: 'ASC', productos: { id: 'ASC' } },
    ...(bloquear ? { lock: { mode: 'pessimistic_write' as const } } : {}),
  });
};

export const construirImpactoSobrepedido = (
  solicitudes: SolicitudPedidoOrm[],
  productoIdsNuevos: number[]
): ImpactoSobrepedidoResponse => {
  const productosNuevos = new Set(productoIdsNuevos);
  const detalleSolicitudes = [...solicitudes]
    .sort((a, b) => a.id - b.id)
    .map(solicitud => ({
      solicitudPedidoId: solicitud.id,
      numeroSolicitud: solicitud.numeroSolicitud,
      sedeId: solicitud.sedeId,
      sede: solicitud.sede?.nombre?.trim() || `Sede ${solicitud.sedeId}`,
      productos: [...solicitud.productos]
        .sort((a, b) => a.id - b.id)
        .map(producto => {
          const cantidadPendiente = calcularCantidadPendienteProducto(producto);
          const afectado = cantidadPendiente > 0;
          const tipoCierre = afectado
            ? productosNuevos.has(producto.productoId)
              ? ('REEMPLAZADO' as const)
              : ('CERRADO_SIN_TRASLADO' as const)
            : null;

          return {
            solicitudPedidoProductoId: producto.id,
            productoId: producto.productoId,
            codigo: producto.producto.codigo.trim(),
            descripcion: producto.producto.descripcionLarga.trim(),
            estadoDespachoCode: producto.estadoDespachoCode,
            estadoDespacho: estadoDespachoProductoTypeFactory(
              producto.estadoDespachoCode
            ).getForHumans(),
            cantidadSolicitada: Number(producto.cantidad),
            cantidadEnviada: Number(producto.cantidadEnviada ?? 0),
            cantidadRechazada: Number(producto.cantidadRechazada ?? 0),
            cantidadSobrepedido: Number(producto.cantidadSobrepedido ?? 0),
            cantidadPendiente,
            afectado,
            tipoCierre,
          };
        }),
    }));
  const productosAfectados = detalleSolicitudes.flatMap(solicitud =>
    solicitud.productos.filter(producto => producto.afectado)
  );
  const versionImpactoSobrepedido = detalleSolicitudes.length
    ? createHash('sha256')
        .update(
          JSON.stringify(
            detalleSolicitudes.map(solicitud => ({
              id: solicitud.solicitudPedidoId,
              productos: solicitud.productos.map(producto => ({
                id: producto.solicitudPedidoProductoId,
                estado: producto.estadoDespachoCode,
                pendiente: producto.cantidadPendiente,
                tipo: producto.tipoCierre,
              })),
            }))
          )
        )
        .digest('hex')
    : null;

  return {
    versionImpactoSobrepedido,
    solicitudes: detalleSolicitudes,
    totalSolicitudes: detalleSolicitudes.length,
    totalProductosCerrados: productosAfectados.length,
    totalCantidadCerrada: Number(
      productosAfectados
        .reduce((total, producto) => total + producto.cantidadPendiente, 0)
        .toFixed(4)
    ),
  };
};

export class ImpactoSobrepedidoDesactualizadoError extends Error {
  constructor(public readonly impacto: ImpactoSobrepedidoResponse) {
    super('El impacto de sobrepedido cambió. Revise nuevamente las solicitudes que se cerrarán.');
  }
}
