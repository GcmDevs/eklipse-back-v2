import { aplicarValidacionKmTanqueoItem } from './aplicar-validacion-km-tanqueo-item.helper';
import { Tanqueo } from '@inn/operaciones/tanqueos/domain/entities';
import {
  CanalRegistro,
  CodigoInconsistencia,
  OrigenTanqueo,
  TipoCombustible,
  TipoRegistroTanqueo,
} from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoTanqueo } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { EvidenciasTanqueo, Kilometraje, OrigenRegistro } from '@inn/operaciones/tanqueos/domain/value-objects';

function tanqueoItem(km: number, fecha: Date): Tanqueo {
  const now = new Date();
  return Tanqueo.rebuild(
    1,
    'TQ-TEST',
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
    fecha,
    null,
    null,
    EstadoTanqueo.APTO_PARA_REVISION,
    EvidenciasTanqueo.empty(),
    OrigenRegistro.create({
      clienteUuid: 'uuid-1',
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

describe('aplicarValidacionKmTanqueoItem (lote por ítem)', () => {
  it('no marca KM_MENOR_ANT si el km es menor que otro ítem del lote pero mayor que la referencia de su fecha', () => {
    const umbral = 500;
    const t1 = tanqueoItem(5000, new Date('2026-01-01T10:00:00Z'));
    const t2 = tanqueoItem(4800, new Date('2026-01-02T10:00:00Z'));

    aplicarValidacionKmTanqueoItem(t1, 1000, umbral, true);
    aplicarValidacionKmTanqueoItem(t2, 4500, umbral, true);

    const menorAntT2 = t2
      .getInconsistencias
      .find(i => i.codigo === CodigoInconsistencia.KM_MENOR_ANT);
    expect(menorAntT2).toBeUndefined();
  });
});
