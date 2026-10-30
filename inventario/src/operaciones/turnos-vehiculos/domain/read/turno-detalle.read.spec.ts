import { DeclaracionView, EntregaDeclaracionResumenRead, MiTurnoItemView, TurnoDetalleView } from './flota.read';

describe('TurnoDetalleView / MiTurnoItemView (GET /turnos/:id y GET /mi-turno)', () => {
  it('no incluye dotacionHoy ni formularios.dotacion', () => {
    const detalle: TurnoDetalleView & MiTurnoItemView = {
      turno: {} as TurnoDetalleView['turno'],
      etapa: 'OPERANDO',
      receptor: null,
      entregaSaliente: {} as TurnoDetalleView['entregaSaliente'],
      recepcionEntrante: null,
      limpiezas: [],
      formularios: {
        entrega: { estado: 'NO_INICIADO' },
        recepcion: null,
        limpieza: { estado: 'NO_INICIADO' },
      },
    };
    expect(detalle).not.toHaveProperty('dotacionHoy');
    expect(detalle.formularios).not.toHaveProperty('dotacion');
  });
});

describe('DeclaracionView / EntregaDeclaracionResumenRead', () => {
  it('exponen id (OID de AMBENTREGADECL) para auditoría y extender plazo', () => {
    const resumen: EntregaDeclaracionResumenRead = {
      id: 91,
      usuario: null,
      estado: 'EN_EDICION' as EntregaDeclaracionResumenRead['estado'],
    };
    const view: DeclaracionView = {
      id: 91,
      rol: 'ENTREGA' as DeclaracionView['rol'],
      usuario: { id: 1, nombre: 'x' },
      estado: 'EN_EDICION' as DeclaracionView['estado'],
      pendientes: 0,
      items: [],
    };
    expect(resumen.id).toBe(91);
    expect(view.id).toBe(91);
  });
});
