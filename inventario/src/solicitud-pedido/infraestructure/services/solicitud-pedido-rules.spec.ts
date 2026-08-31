import {
  calcularEstadoDespachoProducto,
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import {
  calcularEstadoSolicitudPedido,
  validarExistenciasDespacho,
} from './solicitud-pedido-rules';

describe('reglas de solicitudes de pedido', () => {
  describe('existencias de Dinamica', () => {
    it('permite despachar una cantidad igual a la existencia', () => {
      expect(() =>
        validarExistenciasDespacho(
          new Map([['ABC', 5]]),
          new Map([['ABC', { cantidad: 5, productoEncontrado: true }]])
        )
      ).not.toThrow();
    });

    it.each([
      ['producto inexistente', new Map(), /no existe en Dinamica/],
      [
        'existencia en cero',
        new Map([['ABC', { cantidad: 0, productoEncontrado: true }]]),
        /no tiene existencia/,
      ],
      [
        'cantidad superior',
        new Map([['ABC', { cantidad: 4, productoEncontrado: true }]]),
        /supera la existencia/,
      ],
    ])('rechaza %s', (_caso, existencias, mensaje) => {
      expect(() => validarExistenciasDespacho(new Map([['ABC', 5]]), existencias)).toThrow(mensaje);
    });
  });

  describe('estados', () => {
    const pendiente = ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode();
    const parcial = ESTADOS_DESPACHO_PRODUCTO.PARCIAL.getCode();
    const facturado = ESTADOS_DESPACHO_PRODUCTO.FACTURADO.getCode();
    const rechazado = ESTADOS_DESPACHO_PRODUCTO.RECHAZADO.getCode();
    const sobrepedido = ESTADOS_DESPACHO_PRODUCTO.SOBREPEDIDO.getCode();

    it('mantiene la numeración global de estados de solicitud e ítem', () => {
      expect(pendiente).toBe(ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode());
      expect(parcial).toBe(ESTADOS_SOLICITUD_PEDIDO.PARCIAL.getCode());
      expect(facturado).toBe(ESTADOS_SOLICITUD_PEDIDO.FACTURADO.getCode());
      expect(sobrepedido).toBe(ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode());
      expect(rechazado).toBe(ESTADOS_SOLICITUD_PEDIDO.RECHAZADO.getCode());
    });

    it('conserva los umbrales de despacho 75% y 91%', () => {
      expect(calcularEstadoDespachoProducto(100, 74).estadoCode).toBe(pendiente);
      expect(calcularEstadoDespachoProducto(100, 75).estadoCode).toBe(parcial);
      expect(calcularEstadoDespachoProducto(100, 91).estadoCode).toBe(facturado);
    });

    it('calcula pendiente, parcial, rechazado y completo con novedad', () => {
      expect(calcularEstadoSolicitudPedido([pendiente, pendiente])).toBe(
        ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode()
      );
      expect(calcularEstadoSolicitudPedido([pendiente, rechazado])).toBe(
        ESTADOS_SOLICITUD_PEDIDO.PARCIAL.getCode()
      );
      expect(calcularEstadoSolicitudPedido([rechazado, rechazado])).toBe(
        ESTADOS_SOLICITUD_PEDIDO.RECHAZADO.getCode()
      );
      expect(calcularEstadoSolicitudPedido([facturado, rechazado])).toBe(
        ESTADOS_SOLICITUD_PEDIDO.FACTURADO.getCode()
      );
      expect(calcularEstadoSolicitudPedido([facturado, sobrepedido])).toBe(
        ESTADOS_SOLICITUD_PEDIDO.SOBREPEDIDO.getCode()
      );
    });
  });
});
