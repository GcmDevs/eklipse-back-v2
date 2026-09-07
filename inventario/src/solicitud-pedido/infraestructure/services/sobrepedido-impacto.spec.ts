import { SolicitudPedidoOrm, SolicitudPedidoProductoOrm } from '@inn/orm/inn/solicitud-pedido';
import { ESTADOS_DESPACHO_PRODUCTO } from '@inn/types/inn/solicitud-pedido';
import {
  calcularCantidadPendienteProducto,
  construirImpactoSobrepedido,
} from './sobrepedido-impacto';

describe('impacto de sobrepedido', () => {
  const producto = (
    id: number,
    productoId: number,
    codigo: string,
    cantidad: number,
    cantidadEnviada = 0,
    cantidadRechazada = 0,
    cantidadSobrepedido = 0
  ) =>
    ({
      id,
      productoId,
      cantidad,
      cantidadEnviada,
      cantidadRechazada,
      cantidadSobrepedido,
      estadoDespachoCode: ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode(),
      producto: { codigo, descripcionLarga: `Producto ${codigo}` },
    }) as SolicitudPedidoProductoOrm;

  const solicitud = (productos: SolicitudPedidoProductoOrm[]) =>
    ({
      id: 10,
      numeroSolicitud: 'AC0000000001',
      sedeId: 2,
      sede: { nombre: 'Altacentro' },
      productos,
    }) as SolicitudPedidoOrm;

  it('resta cantidades despachadas, rechazadas y cerradas por sobrepedido', () => {
    expect(calcularCantidadPendienteProducto(producto(1, 1, 'ABC', 10, 2, 3, 1))).toBe(4);
  });

  it('cierra todos los saldos activos y distingue los que no se trasladan', () => {
    const impacto = construirImpactoSobrepedido(
      [solicitud([producto(1, 100, 'ABC', 10, 2), producto(2, 200, 'XYZ', 5, 0)])],
      [100]
    );

    expect(impacto.totalSolicitudes).toBe(1);
    expect(impacto.totalProductosCerrados).toBe(2);
    expect(impacto.totalCantidadCerrada).toBe(13);
    expect(impacto.solicitudes[0].productos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: 'ABC', tipoCierre: 'REEMPLAZADO' }),
        expect.objectContaining({ codigo: 'XYZ', tipoCierre: 'CERRADO_SIN_TRASLADO' }),
      ])
    );
  });

  it('genera una versión estable y cambia cuando cambia un saldo', () => {
    const primera = construirImpactoSobrepedido(
      [solicitud([producto(1, 100, 'ABC', 10, 2)])],
      [100]
    );
    const igual = construirImpactoSobrepedido([solicitud([producto(1, 100, 'ABC', 10, 2)])], [100]);
    const actualizado = construirImpactoSobrepedido(
      [solicitud([producto(1, 100, 'ABC', 10, 3)])],
      [100]
    );

    expect(primera.versionImpactoSobrepedido).toBe(igual.versionImpactoSobrepedido);
    expect(actualizado.versionImpactoSobrepedido).not.toBe(primera.versionImpactoSobrepedido);
  });
});
