import { BadInputError } from '@common/domain/errors';
import {
  CausaCierreEntrega,
  EstadoDotacion,
  EstadoEntrega,
  EstadoItemDotacion,
  EstadoNovedadDotacion,
  TipoAmbulanciaFlota,
} from './enums';
import { EntregaFlota } from './entities/entrega.entity';
import { DotacionFlota } from './entities/dotacion.entity';
import { DotacionNovedad } from './entities/dotacion-novedad.entity';

const T = new Date('2026-03-10T08:00:00.000Z');
const h = (n: number) => new Date(T.getTime() + n * 3_600_000);
const m = (n: number) => new Date(T.getTime() + n * 60_000);

describe('flujo de entrega (integración entidad + policies)', () => {
  it('createAbierta deriva los plazos desde el inicio del turno', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    expect(entrega.getEstado).toBe(EstadoEntrega.ABIERTA);
    expect(entrega.getHabilitaExcepcionalEn.toISOString()).toBe('2026-03-10T20:10:00.000Z');
    expect(entrega.getCierreAutomaticoEn.toISOString()).toBe('2026-03-10T21:00:00.000Z');
  });

  it('lanzarEntrega dentro de plazo fija fecha y límite de recepción (+1h)', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    entrega.lanzarEntrega(h(1));
    expect(entrega.getFechaEntrega?.toISOString()).toBe(h(1).toISOString());
    expect(entrega.getLimiteInicioRecepcion?.toISOString()).toBe(h(2).toISOString());
  });

  it('lanzarEntrega pasada la ventana de cierre automático lanza BadInputError', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    expect(() => entrega.lanzarEntrega(h(14))).toThrowError(BadInputError);
  });

  it('puedeRecibirNormal es falso en el instante límite (estricto)', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    entrega.lanzarEntrega(h(1));
    expect(entrega.puedeRecibirNormal(h(1.5))).toBe(true);
    expect(entrega.puedeRecibirNormal(h(2))).toBe(false);
  });

  it('puedeRecibirExcepcional exige estar dentro de la ventana excepcional', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    expect(entrega.puedeRecibirExcepcional(m(729))).toBe(false); // 12h09m, antes de la ventana
    expect(entrega.puedeRecibirExcepcional(m(730))).toBe(true); // 12h10m, inclusivo
    expect(entrega.puedeRecibirExcepcional(m(740))).toBe(true); // 12h20m
    expect(entrega.puedeRecibirExcepcional(h(13))).toBe(false); // en/después del cierre
  });

  it('cerrar sella causa y es idempotente', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    entrega.cerrar(CausaCierreEntrega.AUSENCIA_RECEPTOR, h(13));
    expect(entrega.getEstado).toBe(EstadoEntrega.CERRADA);
    expect(entrega.getCausaCierre).toBe(CausaCierreEntrega.AUSENCIA_RECEPTOR);
    entrega.cerrar(CausaCierreEntrega.COMPLETADA, h(14));
    expect(entrega.getCausaCierre).toBe(CausaCierreEntrega.AUSENCIA_RECEPTOR);
  });

  it('vincularTurnoEntrante cierra la posibilidad de recibir', () => {
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    entrega.lanzarEntrega(h(1));
    entrega.vincularTurnoEntrante(99);
    expect(entrega.puedeRecibirNormal(h(1.5))).toBe(false);
  });
});

describe('DotacionNovedad (integración entidad)', () => {
  it('createAbierta calcula la diferencia cuando hay ambas cantidades', () => {
    const novedad = DotacionNovedad.createAbierta(5, 'oxigeno', {
      cantidadEsperada: 3,
      cantidadEncontrada: 1,
      observacion: 'faltan 2',
    });
    expect(novedad.getEstado).toBe(EstadoNovedadDotacion.ABIERTA);
    expect(novedad.getDiferencia).toBe(-2);
  });

  it('INVALIDADA y reabrir no tocan RESUELTA', () => {
    const abierta = DotacionNovedad.createAbierta(5, 'oxigeno', { observacion: 'faltan' });
    abierta.invalidar(m(10));
    expect(abierta.getEstado).toBe(EstadoNovedadDotacion.INVALIDADA);
    abierta.reabrir(m(20));
    expect(abierta.getEstado).toBe(EstadoNovedadDotacion.ABIERTA);
    abierta.resolver(1, 'ok', m(30));
    abierta.invalidar(m(40));
    expect(abierta.getEstado).toBe(EstadoNovedadDotacion.RESUELTA);
  });

  it('resolver exige observación y no permite doble resolución', () => {
    const novedad = DotacionNovedad.createAbierta(5, 'oxigeno', { observacion: 'faltan 2' });
    expect(() => novedad.resolver(1, '   ', m(30))).toThrowError(BadInputError);
    novedad.resolver(1, 'reabastecido', m(30));
    expect(novedad.getEstado).toBe(EstadoNovedadDotacion.RESUELTA);
    expect(() => novedad.resolver(1, 'otra vez', m(40))).toThrowError(BadInputError);
  });
});

describe('cierres vacíos y vencimiento de dotación', () => {
  it('dotación vacía al vencer se marca ELIMINAR y permite otra el mismo día', () => {
    const a = DotacionFlota.iniciarVerificacion(1, '2026-10-18', TipoAmbulanciaFlota.TAM, 9, 7, {
      items: [{ key: 'x', estado: EstadoItemDotacion.PENDIENTE }],
    });
    expect(a.aplicarVencimiento(new Date(Date.now() + 6 * 3_600_000))).toBe('ELIMINAR');
    const b = DotacionFlota.iniciarVerificacion(1, '2026-10-18', TipoAmbulanciaFlota.TAM, 9, 7, {
      items: [{ key: 'x', estado: EstadoItemDotacion.PENDIENTE }],
    });
    expect(b.getFecha).toBe('2026-10-18');
    expect(b.getEstado).toBe(EstadoDotacion.EN_CURSO);
  });

  it('cerrar vacío es 400 sin code; con pendientes exige confirmarIncompleto', () => {
    const vacia = DotacionFlota.iniciarVerificacion(1, '2026-10-18', TipoAmbulanciaFlota.TAM, 9, 7, {
      items: [{ key: 'x', estado: EstadoItemDotacion.PENDIENTE }],
    });
    try {
      vacia.cerrar(h(1));
      fail('debía fallar');
    } catch (e) {
      expect(e).toBeInstanceOf(BadInputError);
      expect((e as BadInputError).businessCode).toBeUndefined();
    }
    const parcial = DotacionFlota.iniciarVerificacion(1, '2026-10-18', TipoAmbulanciaFlota.TAM, 9, 7, {
      items: [
        { key: 'x', estado: EstadoItemDotacion.CONFORME },
        { key: 'y', estado: EstadoItemDotacion.PENDIENTE },
      ],
    });
    try {
      parcial.cerrar(h(1));
      fail('debía fallar');
    } catch (e) {
      expect(e).toBeInstanceOf(BadInputError);
      expect((e as BadInputError).businessCode).toBe('INCOMPLETA');
    }
    parcial.cerrar(h(1), true);
    expect(parcial.getCompleta).toBe(false);
    expect(parcial.getCierreAutomatico).toBe(false);
  });

  it('extender plazo solo una vez y solo si sigue vigente', () => {
    const dot = DotacionFlota.iniciarVerificacion(1, '2026-10-18', TipoAmbulanciaFlota.TAM, 9, 7, {
      items: [{ key: 'x', estado: EstadoItemDotacion.PENDIENTE }],
    });
    const nuevo = dot.extenderPlazo(30, h(1));
    expect(nuevo.getTime()).toBeGreaterThan(h(1).getTime());
    expect(() => dot.extenderPlazo(10, h(1))).toThrowError(BadInputError);
    const entrega = EntregaFlota.createAbierta(10, 20, 30, T);
    expect(() => entrega.extenderPlazo(10, h(14))).toThrowError(BadInputError);
  });
});
