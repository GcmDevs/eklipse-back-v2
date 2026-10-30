import { BadInputError, ForbiddenAccessError } from '@common/domain/errors';
import {
  CanalRegistro,
  CodigoInconsistencia,
  OrigenTanqueo,
  SeveridadInconsistencia,
  TipoCombustible,
  TipoEvidencia,
  TipoRegistroTanqueo,
  UnidadMedidaCombustible,
} from '../enums';
import {
  EstadoEvidencia,
  EstadoInconsistencia,
  EstadoTanqueo,
  ResultadoInconsistencia,
} from '../enums/estados.enum';
import { Inconsistencia, createInconsistencia } from '../types';
import {
  CantidadCombustible,
  EvidenciaSinResolverError,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '../value-objects';
import { Tanqueo } from './tanqueo.entity';

function buildTanqueo(
  overrides: {
    estado?: EstadoTanqueo;
    km?: number | null;
    cantidad?: number | null;
    valor?: number | null;
    inconsistencias?: Inconsistencia[];
    registradoPorId?: number;
    conductorRealId?: number | null;
    canalRegistro?: CanalRegistro;
    creadoOffline?: boolean;
    evidencias?: EvidenciasTanqueo;
  } = {}
): Tanqueo {
  const now = new Date();
  return Tanqueo.rebuild(
    1,
    'TQ-1',
    10,
    overrides.registradoPorId ?? 1,
    TipoRegistroTanqueo.CONDUCTOR,
    overrides.canalRegistro ?? CanalRegistro.WEB,
    overrides.conductorRealId ?? null,
    OrigenTanqueo.ESTACION,
    null,
    overrides.km != null ? Kilometraje.create(overrides.km) : null,
    null,
    overrides.valor != null ? ValorMonetario.create(overrides.valor) : null,
    overrides.cantidad != null
      ? CantidadCombustible.create(overrides.cantidad, UnidadMedidaCombustible.GALONES, TipoCombustible.DIESEL)
      : null,
    TipoCombustible.DIESEL,
    null,
    1,
    new Date('2026-02-01T10:00:00Z'),
    null,
    null,
    overrides.estado ?? EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
    overrides.evidencias ?? EvidenciasTanqueo.empty(),
    OrigenRegistro.create({
      clienteUuid: 'u',
      creadoOffline: overrides.creadoOffline ?? false,
      fechaCreacionLocal: now,
      dispositivoId: null,
    }),
    null,
    null,
    null,
    false,
    null,
    null,
    null,
    overrides.inconsistencias ?? [],
    now,
    now
  );
}

function evidenciaCapturada(tipo: TipoEvidencia): {
  tipo: TipoEvidencia;
  estado: EstadoEvidencia;
  mediaId: number;
  motivoOmision: null;
  fecha: Date;
} {
  return {
    tipo,
    estado: EstadoEvidencia.CAPTURADA,
    mediaId: 1,
    motivoOmision: null,
    fecha: new Date(),
  };
}

function registroBase() {
  return {
    codigo: 'TQ-NEW',
    activoId: 10,
    registradoPorId: 1,
    tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
    canalRegistro: CanalRegistro.WEB,
    conductorRealId: null as number | null,
    origen: OrigenTanqueo.ESTACION,
    repositorioId: null as number | null,
    kilometraje: Kilometraje.create(1000),
    valorTotalPagado: ValorMonetario.create(50_000),
    cantidadCombustible: CantidadCombustible.create(
      10,
      UnidadMedidaCombustible.GALONES,
      TipoCombustible.DIESEL
    ),
    tipoCombustible: TipoCombustible.DIESEL,
    estacionServicioId: 1,
    fechaTanqueo: new Date('2026-02-01T10:00:00Z'),
    ubicacion: null,
    observaciones: null,
    evidencias: EvidenciasTanqueo.fromEntradas([evidenciaCapturada(TipoEvidencia.TABLERO_INICIAL)]),
    origenRegistro: OrigenRegistro.create({
      clienteUuid: 'u',
      creadoOffline: false,
      fechaCreacionLocal: new Date(),
      dispositivoId: null,
    }),
  };
}

describe('Tanqueo.register', () => {
  it('exige repositorioId cuando el origen es REPOSITORIO', () => {
    expect(() =>
      Tanqueo.register({ ...registroBase(), origen: OrigenTanqueo.REPOSITORIO, repositorioId: null })
    ).toThrow(BadInputError);
  });

  it('exige tipoRegistro y canalRegistro', () => {
    expect(() => Tanqueo.register({ ...registroBase(), tipoRegistro: undefined as any })).toThrow(
      BadInputError
    );
    expect(() => Tanqueo.register({ ...registroBase(), canalRegistro: undefined as any })).toThrow(
      BadInputError
    );
  });

  it('rechaza CONDUCTOR con conductorRealId', () => {
    expect(() => Tanqueo.register({ ...registroBase(), conductorRealId: 99 })).toThrow(BadInputError);
  });

  it('lanza EvidenciaSinResolverError si faltan evidencias requeridas', () => {
    try {
      Tanqueo.register({
        ...registroBase(),
        evidencias: EvidenciasTanqueo.empty(),
      });
      fail('debió lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(EvidenciaSinResolverError);
      expect((e as EvidenciaSinResolverError).tiposFaltantes).toContain(
        TipoEvidencia.TABLERO_INICIAL
      );
    }
  });

  it('crea el tanqueo en VALIDADO_AUTOMATICAMENTE', () => {
    const t = Tanqueo.register(registroBase());
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE);
  });
});

describe('Tanqueo.sealEstadoInicial', () => {
  it('pasa a APTO_PARA_REVISION con crítica abierta', () => {
    const t = buildTanqueo({
      inconsistencias: [
        createInconsistencia(CodigoInconsistencia.EVI_OMIT, SeveridadInconsistencia.CRITICA, 'x'),
      ],
    });
    t.sealEstadoInicial();
    expect(t.getEstado).toBe(EstadoTanqueo.APTO_PARA_REVISION);
  });

  it('queda VALIDADO_AUTOMATICAMENTE sin críticas', () => {
    const t = buildTanqueo({});
    t.sealEstadoInicial();
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE);
  });
});

describe('Tanqueo.calculateDerivados', () => {
  it('calcula km recorridos y rendimiento cuando el km es mayor', () => {
    const t = buildTanqueo({ km: 6000, cantidad: 40 });
    t.calculateDerivados(Kilometraje.create(5000));
    expect(t.getKilometrosRecorridos).toBe(1000);
    expect(t.getRendimiento).toBe(25);
  });

  it('deja null cuando el km es menor a la referencia', () => {
    const t = buildTanqueo({ km: 4000, cantidad: 40 });
    t.calculateDerivados(Kilometraje.create(5000));
    expect(t.getKilometrosRecorridos).toBeNull();
    expect(t.getRendimiento).toBeNull();
  });

  it('no hace nada sin km o sin referencia', () => {
    const t = buildTanqueo({ km: 6000, cantidad: 40 });
    t.calculateDerivados(null);
    expect(t.getKilometrosRecorridos).toBeNull();
  });
});

describe('Tanqueo.registerInconsistenciaKilometraje', () => {
  it('registra KM_MENOR_ANT (ADVERTENCIA) si el km es menor', () => {
    const t = buildTanqueo({ km: 4000 });
    t.registerInconsistenciaKilometraje(Kilometraje.create(5000), 500);
    const inc = t.getInconsistencias.find(i => i.codigo === CodigoInconsistencia.KM_MENOR_ANT);
    expect(inc).toBeDefined();
    expect(inc?.severidad).toBe(SeveridadInconsistencia.ADVERTENCIA);
  });

  it('registra KM_SALTO si supera el umbral', () => {
    const t = buildTanqueo({ km: 10000 });
    t.registerInconsistenciaKilometraje(Kilometraje.create(5000), 500);
    expect(t.getInconsistencias.map(i => i.codigo)).toContain(CodigoInconsistencia.KM_SALTO);
  });

  it('no registra nada si no supera el umbral ni es menor', () => {
    const t = buildTanqueo({ km: 5200 });
    t.registerInconsistenciaKilometraje(Kilometraje.create(5000), 500);
    expect(t.getInconsistencias).toHaveLength(0);
  });
});

describe('Tanqueo.registerInconsistenciaCapacidad / ValorAlto / Duplicado', () => {
  it('CANT_COMB_CAP si supera el margen de capacidad', () => {
    const t = buildTanqueo({ cantidad: 53 });
    t.registerInconsistenciaCapacidad(55);
    expect(t.getInconsistencias.map(i => i.codigo)).toContain(CodigoInconsistencia.CANT_COMB_CAP);
  });

  it('VALOR_ALTO_INU si el valor está fuera de rango', () => {
    const t = buildTanqueo({ valor: 2000 });
    t.registerInconsistenciaValorAlto(null, 2.5);
    expect(t.getInconsistencias.map(i => i.codigo)).toContain(CodigoInconsistencia.VALOR_ALTO_INU);
  });

  it('TQ_DUP siempre que se llame', () => {
    const t = buildTanqueo({});
    t.registerInconsistenciaDuplicadoSospechoso();
    expect(t.getInconsistencias.map(i => i.codigo)).toContain(CodigoInconsistencia.TQ_DUP);
  });
});

describe('Tanqueo.hasInconsistenciasCriticasAbiertas', () => {
  it('true con crítica ABIERTA', () => {
    const t = buildTanqueo({
      inconsistencias: [
        createInconsistencia(CodigoInconsistencia.EVI_OMIT, SeveridadInconsistencia.CRITICA, 'x'),
      ],
    });
    expect(t.hasInconsistenciasCriticasAbiertas()).toBe(true);
  });

  it('false con crítica CERRADA', () => {
    const cerrada: Inconsistencia = {
      codigo: CodigoInconsistencia.EVI_OMIT,
      campo: 'tipo',
      severidad: SeveridadInconsistencia.CRITICA,
      mensaje: 'x',
      estado: EstadoInconsistencia.CERRADA,
      fechaResolucion: new Date(),
      resultado: ResultadoInconsistencia.CORREGIDA,
    };
    const t = buildTanqueo({ inconsistencias: [cerrada] });
    expect(t.hasInconsistenciasCriticasAbiertas()).toBe(false);
  });
});

describe('Tanqueo.approve', () => {
  it('aprueba desde APTO_PARA_REVISION', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.APTO_PARA_REVISION });
    t.approve(2);
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_MANUALMENTE);
    expect(t.getDecididoPorUsuarioId?.getValor).toBe(2);
  });

  it('exige motivo (override) cuando hay crítica abierta', () => {
    const t = buildTanqueo({
      estado: EstadoTanqueo.APTO_PARA_REVISION,
      inconsistencias: [
        createInconsistencia(CodigoInconsistencia.EVI_OMIT, SeveridadInconsistencia.CRITICA, 'x'),
      ],
    });
    expect(() => t.approve(2)).toThrow(BadInputError);
    t.approve(2, 'apruebo excepción');
    expect(t.getAprobacionConOverride).toBe(true);
    expect(t.getMotivoDecision).toBe('APRUEBO EXCEPCIÓN');
  });

  it('no permite que el registrador apruebe su propio registro', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.APTO_PARA_REVISION, registradoPorId: 5 });
    expect(() => t.approve(5)).toThrow(ForbiddenAccessError);
  });
});

describe('Tanqueo.markReviewed', () => {
  it('solo desde VALIDADO_AUTOMATICAMENTE', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    t.markReviewed(2);
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_MANUALMENTE);
  });

  it('lanza desde APTO_PARA_REVISION', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.APTO_PARA_REVISION });
    expect(() => t.markReviewed(2)).toThrow(BadInputError);
  });
});

describe('Tanqueo.review', () => {
  it('desde APTO_PARA_REVISION a VALIDADO_MANUALMENTE delega en approve', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.APTO_PARA_REVISION });
    t.review(2, EstadoTanqueo.VALIDADO_MANUALMENTE);
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_MANUALMENTE);
  });

  it('desde VALIDADO_AUTOMATICAMENTE a VALIDADO_MANUALMENTE delega en markReviewed', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    t.review(2, EstadoTanqueo.VALIDADO_MANUALMENTE);
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_MANUALMENTE);
  });

  it('lanza si intenta validar manualmente desde VALIDADO_MANUALMENTE', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_MANUALMENTE });
    expect(() => t.review(2, EstadoTanqueo.VALIDADO_MANUALMENTE)).toThrow(BadInputError);
  });

  it('permite pasar a APTO_PARA_REVISION desde VALIDADO_MANUALMENTE', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_MANUALMENTE });
    t.review(2, EstadoTanqueo.APTO_PARA_REVISION);
    expect(t.getEstado).toBe(EstadoTanqueo.APTO_PARA_REVISION);
  });

  // Comportamiento verificado (no el ideal): la máquina de estados NO define
  // VALIDADO_AUTOMATICAMENTE -> APTO_PARA_REVISION, así que review() lanza BadInputError.
  it('rechaza APTO_PARA_REVISION desde VALIDADO_AUTOMATICAMENTE (SM no lo define)', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    expect(() => t.review(2, EstadoTanqueo.APTO_PARA_REVISION)).toThrow(BadInputError);
  });

  it('rechaza estadoDestino no soportado', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    expect(() => t.review(2, EstadoTanqueo.ANULADO)).toThrow(BadInputError);
  });

  it('no permite auto-revisión', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE, registradoPorId: 7 });
    expect(() => t.review(7, EstadoTanqueo.VALIDADO_MANUALMENTE)).toThrow(ForbiddenAccessError);
  });
});

describe('Tanqueo.voidRecord', () => {
  it('exige motivo no vacío', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    expect(() => t.voidRecord(2, '   ')).toThrow(BadInputError);
  });

  it('anula desde un estado válido y normaliza el motivo', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_MANUALMENTE });
    t.voidRecord(2, 'motivo válido');
    expect(t.getEstado).toBe(EstadoTanqueo.ANULADO);
    expect(t.getMotivoAnulacion).toBe('MOTIVO VÁLIDO');
  });

  it('no permite anular un tanqueo ya anulado', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.ANULADO });
    expect(() => t.voidRecord(2, 'motivo válido')).toThrow(BadInputError);
  });
});

describe('Tanqueo.isLecturaOdometroConfiable', () => {
  it('false sin kilometraje', () => {
    expect(buildTanqueo({}).isLecturaOdometroConfiable(5000, 500)).toBe(false);
  });

  it('true sin referencia previa', () => {
    expect(buildTanqueo({ km: 6000 }).isLecturaOdometroConfiable(null, 500)).toBe(true);
  });

  it('false si el km es menor a la referencia', () => {
    expect(buildTanqueo({ km: 4000 }).isLecturaOdometroConfiable(5000, 500)).toBe(false);
  });

  it('false si el salto excede el umbral', () => {
    expect(buildTanqueo({ km: 6000 }).isLecturaOdometroConfiable(5000, 500)).toBe(false);
  });

  it('true en salto dentro del umbral', () => {
    expect(buildTanqueo({ km: 5200 }).isLecturaOdometroConfiable(5000, 500)).toBe(true);
  });
});

describe('Tanqueo.getEvidenciasCompletas', () => {
  it('true cuando la evidencia requerida está capturada', () => {
    const t = buildTanqueo({
      evidencias: EvidenciasTanqueo.fromEntradas([evidenciaCapturada(TipoEvidencia.TABLERO_INICIAL)]),
    });
    expect(t.getEvidenciasCompletas).toBe(true);
  });

  it('false cuando falta la evidencia requerida', () => {
    expect(buildTanqueo({}).getEvidenciasCompletas).toBe(false);
  });
});

describe('Tanqueo.confirmRegistro', () => {
  it('marca fecha de sincronización solo si se creó offline', () => {
    const online = buildTanqueo({ creadoOffline: false });
    online.confirmRegistro();
    expect(online.getOrigenRegistro.getFechaSincronizacion).toBeNull();

    const offline = buildTanqueo({ creadoOffline: true });
    offline.confirmRegistro();
    expect(offline.getOrigenRegistro.getFechaSincronizacion).not.toBeNull();
  });
});

describe('Tanqueo.sincronizarEstadoTrasReevaluacionAlertas', () => {
  it('no cambia un tanqueo ANULADO', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.ANULADO });
    t.sincronizarEstadoTrasReevaluacionAlertas(true);
    expect(t.getEstado).toBe(EstadoTanqueo.ANULADO);
  });

  it('pasa a APTO_PARA_REVISION desde VALIDADO_MANUALMENTE cuando aparecen críticas', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_MANUALMENTE });
    t.sincronizarEstadoTrasReevaluacionAlertas(true);
    expect(t.getEstado).toBe(EstadoTanqueo.APTO_PARA_REVISION);
  });

  // BUG latente verificado: la rama para VALIDADO_AUTOMATICAMENTE llama a
  // assertTanqueoTransitionState(AUTO, APTO), transición que el SM no permite,
  // por lo que lanza BadInputError en lugar de mover a APTO_PARA_REVISION.
  it('lanza si aparece crítica estando VALIDADO_AUTOMATICAMENTE (SM no permite AUTO→APTO)', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.VALIDADO_AUTOMATICAMENTE });
    expect(() => t.sincronizarEstadoTrasReevaluacionAlertas(true)).toThrow(BadInputError);
  });

  it('vuelve a VALIDADO_AUTOMATICAMENTE desde APTO si ya no hay críticas', () => {
    const t = buildTanqueo({ estado: EstadoTanqueo.APTO_PARA_REVISION });
    t.sincronizarEstadoTrasReevaluacionAlertas(false);
    expect(t.getEstado).toBe(EstadoTanqueo.VALIDADO_AUTOMATICAMENTE);
  });
});
