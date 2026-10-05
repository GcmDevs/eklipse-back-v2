import { EstanteInventarioOrm, ProductoEstantesOrm } from '@orm/inn/inventario';
import { EstanteResponse, ProductoEstanteResponse } from '../interface';
import {
  construirEstadoConteoProducto,
  conteoCompletadoParaTodos,
  estadoConteoCoincide,
  resolverEstadoProductoAsignado,
} from '../inventario.policies';
import { ESTADO_CONTEO } from '@ctypes/inn/inventario';

interface ContextoAsignacionConteo {
  cicloId: number | null;
  numeroConteo: number | null;
}

export class EstantesMapper {
  static toResponse(
    estante: EstanteInventarioOrm,
    contextoAsignacion?: ContextoAsignacionConteo
  ): EstanteResponse {
    const asignaciones = (estante.asignaciones ?? []).filter(
      a =>
        a.isActivo &&
        (a.numeroConteo === 1 || a.numeroConteo === 2) &&
        a.ciclo?.estado === 'ABIERTO'
    );
    const cicloId = contextoAsignacion
      ? contextoAsignacion.cicloId
      : (asignaciones
          .map(asignacion => asignacion.cicloId)
          .filter((id): id is number => id != null)
          .sort((a, b) => b - a)[0] ?? null);
    const productosActivos = (estante.productos ?? []).filter(
      p => p.isActivo && p.isActivoEstante && p.isDeleted !== true
    );
    const detallesPorProducto = productosActivos.map(producto =>
      cicloId == null
        ? []
        : (producto.conteoInventario ?? [])
            .filter(conteo => conteo.cicloId === cicloId)
            .flatMap(conteo => conteo.detalleConteo ?? [])
    );
    const numeroConteoActual = contextoAsignacion
      ? contextoAsignacion.numeroConteo
      : asignaciones.length
        ? Math.max(...asignaciones.map(a => a.numeroConteo))
        : 0;
    const numeroConteoUnoRealizado = conteoCompletadoParaTodos(detallesPorProducto, 1);
    const numeroConteoDosRealizado = conteoCompletadoParaTodos(detallesPorProducto, 2);
    return {
      id: estante.id,
      nombreEstante: estante.nombreEstante,
      estado: estante.estado,
      numeroConteoActual,
      cicloId: cicloId,
      numeroConteoUnoRealizado,
      numeroConteoDosRealizado,
      almacen: {
        id: estante.almacen?.id,
        nombre: estante.almacen?.nombre,
      },
      productos: productosActivos.map(producto =>
        EstantesMapper.toProductoEstanteResponse(producto, cicloId, numeroConteoActual)
      ),
    };
  }
  private static toProductoEstanteResponse(
    productoEstante: ProductoEstantesOrm,
    cicloId: number | null,
    numeroConteoActual: number | null
  ): ProductoEstanteResponse {
    const conteosCiclo =
      cicloId == null
        ? []
        : (productoEstante.conteoInventario ?? []).filter(conteo => conteo.cicloId === cicloId);
    const detalles = conteosCiclo.flatMap(conteo => conteo.detalleConteo ?? []);
    const estadoConteo = construirEstadoConteoProducto(detalles);
    const conteoVigente = conteosCiclo[0];
    const estadoAsignado = resolverEstadoProductoAsignado(
      detalles,
      numeroConteoActual,
      estadoConteoCoincide(conteoVigente?.estado, ESTADO_CONTEO.AJUSTADO.getCode()),
      conteoVigente?.isCerrado === true
    );

    return {
      id: productoEstante.id,
      stock: Number(productoEstante.stock),
      ubicacion: productoEstante.ubicacion,
      tipo: productoEstante.tipo,
      conteosRealizados: estadoConteo.conteosRealizados,
      siguienteConteoPermitido: estadoConteo.siguienteConteoPermitido,
      ...estadoAsignado,
      producto: {
        id: productoEstante.producto.id,
        nombre: productoEstante.producto.descripcionLarga,
        codigo: productoEstante.producto.codigo,
        fabricante: productoEstante.producto.fabricante?.nombre ?? null,
        agrupamiento: productoEstante.producto.agrupamiento?.nombre ?? null,
        codigoAgrupamiento: productoEstante.producto.agrupamiento?.codigo ?? null,
        existenciasTotal:
          productoEstante.producto.existencias?.reduce(
            (acc, item) => acc + Number(item.cantidad),
            0
          ) ?? 0,
      },
    };
  }
}
