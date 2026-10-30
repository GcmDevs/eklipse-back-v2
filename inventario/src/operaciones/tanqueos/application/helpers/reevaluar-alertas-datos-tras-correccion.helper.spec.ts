import { reevaluarAlertasDatosTrasCorreccion } from './reevaluar-alertas-datos-tras-correccion.helper';
import { Tanqueo, TanqueoCorreccion, TanqueoInconsistencia } from '@inn/operaciones/tanqueos/domain/entities';
import {
  CanalRegistro,
  CodigoInconsistencia,
  OrigenTanqueo,
  SeveridadInconsistencia,
  TipoCombustible,
  TipoRegistroTanqueo,
} from '@inn/operaciones/tanqueos/domain/enums';
import {
  EstadoInconsistencia,
  EstadoTanqueo,
  ResultadoInconsistencia,
} from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { TanqueoRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { EvidenciasTanqueo, Kilometraje, OrigenRegistro } from '@inn/operaciones/tanqueos/domain/value-objects';
function tanqueoKm(km: number): Tanqueo {
  const now = new Date();
  return Tanqueo.rebuild(
    1,
    'TQ',
    10,
    1,
    TipoRegistroTanqueo.CONDUCTOR,
    CanalRegistro.WEB,
    null,
    OrigenTanqueo.ESTACION,
    null,
    Kilometraje.create(km),
    null,
    null,
    null,
    TipoCombustible.G_CORRIENTE,
    null,
    1,
    new Date('2026-02-01T10:00:00Z'),
    null,
    null,
    EstadoTanqueo.APTO_PARA_REVISION,
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

describe('reevaluarAlertasDatosTrasCorreccion', () => {
  it('cierra KM_MENOR_ANT sin ids en el PATCH, vincula corrección y deja nota de traza', async () => {
    const abierta = TanqueoInconsistencia.rebuild(
      5,
      1,
      CodigoInconsistencia.KM_MENOR_ANT,
      'kilometraje',
      SeveridadInconsistencia.ADVERTENCIA,
      new Date(),
      EstadoInconsistencia.ABIERTA,
      null,
      null,
      null,
      false,
      null,
      null
    );
    const correccionGuardada = TanqueoCorreccion.rebuild(
      99,
      1,
      'KILOMETRAJE',
      '4000',
      '5000',
      'Corrección km',
      null,
      1,
      new Date()
    );
    const tanqueoRepository = {
      getPromedioValorPorActivo: async () => ({ promedio: null, muestra: 0 }),
      existsDuplicadoSospechoso: async () => false,
    } as unknown as TanqueoRepository;

    const result = await reevaluarAlertasDatosTrasCorreccion({
      tanqueo: tanqueoKm(5000),
      tanqueoId: 1,
      usuarioId: 1,
      motivoCorreccion: 'Corrección km',
      correccionesGuardadas: [correccionGuardada],
      inconsistenciasAbiertas: [abierta],
      validaOdometro: true,
      kmAnterior: Kilometraje.create(4500),
      umbralSalto: 500,
      capacidadTanque: null,
      tanqueoRepository,
      reevaluarKm: true,
      reevaluarCantidad: false,
      reevaluarValor: false,
      reevaluarDuplicado: false,
    });

    expect(result.inconsistenciasActualizadas).toHaveLength(1);
    expect(abierta.getEstadoInconsistencia).toBe(EstadoInconsistencia.CERRADA);
    expect(abierta.getResultado).toBe(ResultadoInconsistencia.CORREGIDA);
    expect(abierta.getNotaResolucion).toContain('CORRECCIÓN 99');
    expect(abierta.getNotaResolucion).toContain('KILOMETRAJE');
    expect(abierta.getNotaResolucion).toContain('NO CERRÓ ESTA ALERTA');
    expect(result.correccionesActualizadas[0].getInconsistenciaId?.getValor).toBe(5);
  });
});
