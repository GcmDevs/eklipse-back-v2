import {
  CanalRegistro,
  CodigoInconsistencia,
  OrigenTanqueo,
  SeveridadInconsistencia,
  TipoCombustible,
  TipoRegistroTanqueo,
  UnidadMedidaCombustible,
} from '../enums';
import { EstadoTanqueo } from '../enums/estados.enum';
import { Tanqueo } from '../entities';
import {
  CantidadCombustible,
  EvidenciasTanqueo,
  Kilometraje,
  OrigenRegistro,
  ValorMonetario,
} from '../value-objects';
import {
  CODIGOS_INCONSISTENCIA_DATOS,
  evaluarInconsistenciasDatosDelTanqueo,
  isCodigoInconsistenciaDatos,
} from './evaluar-inconsistencias-datos-tanqueo.helper';

function buildTanqueo(overrides: {
  km?: number | null;
  cantidad?: number | null;
  valor?: number | null;
  origen?: OrigenTanqueo;
}): Tanqueo {
  const now = new Date();
  return Tanqueo.rebuild(
    1,
    'TQ-1',
    10,
    1,
    TipoRegistroTanqueo.CONDUCTOR,
    CanalRegistro.WEB,
    null,
    overrides.origen ?? OrigenTanqueo.ESTACION,
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
    EstadoTanqueo.VALIDADO_AUTOMATICAMENTE,
    EvidenciasTanqueo.empty(),
    OrigenRegistro.create({
      clienteUuid: 'u',
      creadoOffline: false,
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
    [],
    now,
    now
  );
}

const sinDuplicado = {
  validaOdometro: false,
  kmAnterior: null,
  umbralSalto: 500,
  capacidadTanque: null,
  promedioValor: null,
  muestraValor: 0,
  duplicadoSospechoso: false,
};

describe('evaluarInconsistenciasDatosDelTanqueo', () => {
  it('genera KM_MENOR_ANT cuando el km es menor a la referencia y validaOdometro', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ km: 4000 }), {
      ...sinDuplicado,
      validaOdometro: true,
      kmAnterior: Kilometraje.create(5000),
    });
    expect(incs.map(i => i.codigo)).toContain(CodigoInconsistencia.KM_MENOR_ANT);
  });

  it('no genera alerta de km si validaOdometro es false', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ km: 4000 }), {
      ...sinDuplicado,
      validaOdometro: false,
      kmAnterior: Kilometraje.create(5000),
    });
    expect(incs.some(i => i.codigo === CodigoInconsistencia.KM_MENOR_ANT)).toBe(false);
  });

  it('genera CANT_COMB_CAP cuando supera la capacidad del tanque', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ cantidad: 53 }), {
      ...sinDuplicado,
      capacidadTanque: 55,
    });
    expect(incs.map(i => i.codigo)).toContain(CodigoInconsistencia.CANT_COMB_CAP);
  });

  it('genera VALOR_ALTO_INU fuera de rango solo para origen ESTACION', () => {
    const estacion = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ valor: 2000 }), sinDuplicado);
    expect(estacion.map(i => i.codigo)).toContain(CodigoInconsistencia.VALOR_ALTO_INU);

    const repositorio = evaluarInconsistenciasDatosDelTanqueo(
      buildTanqueo({ valor: 2000, origen: OrigenTanqueo.REPOSITORIO }),
      sinDuplicado
    );
    expect(repositorio.some(i => i.codigo === CodigoInconsistencia.VALOR_ALTO_INU)).toBe(false);
  });

  it('no compara contra promedio si la muestra es menor al mínimo', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ valor: 500_000 }), {
      ...sinDuplicado,
      promedioValor: 1000,
      muestraValor: 1,
    });
    expect(incs).toHaveLength(0);
  });

  it('genera TQ_DUP cuando duplicadoSospechoso', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({}), {
      ...sinDuplicado,
      duplicadoSospechoso: true,
    });
    expect(incs.map(i => i.codigo)).toContain(CodigoInconsistencia.TQ_DUP);
  });

  it('devuelve las alertas con severidad ADVERTENCIA', () => {
    const incs = evaluarInconsistenciasDatosDelTanqueo(buildTanqueo({ cantidad: 53 }), {
      ...sinDuplicado,
      capacidadTanque: 55,
    });
    expect(incs.every(i => i.severidad === SeveridadInconsistencia.ADVERTENCIA)).toBe(true);
  });
});

describe('isCodigoInconsistenciaDatos', () => {
  it('reconoce los códigos de datos y rechaza los de evidencia', () => {
    for (const codigo of CODIGOS_INCONSISTENCIA_DATOS) {
      expect(isCodigoInconsistenciaDatos(codigo)).toBe(true);
    }
    expect(isCodigoInconsistenciaDatos(CodigoInconsistencia.EVI_OMIT)).toBe(false);
  });
});
