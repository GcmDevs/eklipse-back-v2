import {
  ESTADOS_DESPACHO_PRODUCTO,
  ESTADOS_SOLICITUD_PEDIDO,
} from '@inn/types/inn/solicitud-pedido';
import { agregarReferenciasProductosEnOtrasSedes } from './otras-sedes';

describe('alerta de productos solicitados en otras sedes', () => {
  it('relaciona el mismo código entre sedes de contextos diferentes', () => {
    const solicitudes = [
      {
        id: 3,
        numeroSolicitud: 'VDP0003',
        contextCode: 'VALLEDUPAR',
        estadoCode: ESTADOS_SOLICITUD_PEDIDO.PENDIENTE.getCode(),
        sede: { id: 1, codigo: 'VDP', nombre: 'Valledupar' },
        tieneProductosSolicitadosEnOtrasSedes: false,
        productos: [
          {
            codigo: 'M2047401',
            cantidadPendiente: 4,
            estadoDespachoCode: ESTADOS_DESPACHO_PRODUCTO.PENDIENTE.getCode(),
            solicitadoEnOtrasSedes: false,
            cantidadPendienteOtrasSedes: 0,
            solicitudesOtrasSedes: [],
          },
        ],
      },
    ] as any;

    agregarReferenciasProductosEnOtrasSedes(solicitudes, [
      {
        codigo: ' M2047401 ',
        sedeKey: 'ALTACENTRO:1',
        solicitudPedidoId: 1,
        numeroSolicitud: 'CM0001',
        contextCode: 'ALTACENTRO',
        sede: { id: 1, codigo: 'CM', nombre: 'Clínica del Mar' },
        cantidadSolicitada: 10,
        cantidadEnviada: 2,
        cantidadPendiente: 8,
        estadoDespachoCode: ESTADOS_DESPACHO_PRODUCTO.PARCIAL.getCode(),
      },
    ]);

    expect(solicitudes[0].productos[0].solicitadoEnOtrasSedes).toBe(true);
    expect(solicitudes[0].productos[0].cantidadPendienteOtrasSedes).toBe(8);
    expect(solicitudes[0].productos[0].solicitudesOtrasSedes).toEqual([
      expect.objectContaining({ numeroSolicitud: 'CM0001', contextCode: 'ALTACENTRO' }),
    ]);
  });
});
