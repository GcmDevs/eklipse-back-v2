import {
  esSolicitudPedidoCerrada,
  EstadoSolicitudPedidoCode,
  ESTADOS_DESPACHO_PRODUCTO,
} from '@inn/types/inn/solicitud-pedido';

export interface SolicitudProductoOtraSedeResponse {
  solicitudPedidoId: number;
  numeroSolicitud: string;
  contextCode: string;
  sede: { id: number; codigo: string; nombre: string };
  cantidadSolicitada: number;
  cantidadEnviada: number;
  cantidadPendiente: number;
  estadoDespachoCode: number;
}

export interface SolicitudProductoOtraSedeReferencia extends SolicitudProductoOtraSedeResponse {
  codigo: string;
  sedeKey: string;
}

interface ProductoObjetivoOtraSede {
  codigo: string;
  cantidadPendiente: number;
  estadoDespachoCode: number;
  solicitadoEnOtrasSedes: boolean;
  cantidadPendienteOtrasSedes: number;
  solicitudesOtrasSedes: SolicitudProductoOtraSedeResponse[];
}

interface SolicitudObjetivoOtraSede {
  contextCode: string;
  estadoCode: EstadoSolicitudPedidoCode;
  sede: { id: number };
  productos: ProductoObjetivoOtraSede[];
  tieneProductosSolicitadosEnOtrasSedes: boolean;
}

const normalizarCodigo = (codigo: string): string => codigo?.trim().toUpperCase() ?? '';

export const agregarReferenciasProductosEnOtrasSedes = (
  solicitudes: SolicitudObjetivoOtraSede[],
  referencias: SolicitudProductoOtraSedeReferencia[]
): void => {
  const solicitudesPorProducto = new Map<string, SolicitudProductoOtraSedeReferencia[]>();
  referencias.forEach(referencia => {
    const codigo = normalizarCodigo(referencia.codigo);
    if (!codigo) return;
    solicitudesPorProducto.set(codigo, [...(solicitudesPorProducto.get(codigo) ?? []), referencia]);
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

      const codigo = normalizarCodigo(producto.codigo);
      const solicitudesOtrasSedes = (solicitudesPorProducto.get(codigo) ?? [])
        .filter(referencia => referencia.sedeKey !== sedeKey)
        .map(({ codigo: _codigo, sedeKey: _sedeKey, ...referencia }) => referencia);

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
