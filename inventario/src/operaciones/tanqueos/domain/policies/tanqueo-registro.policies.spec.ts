import { BadInputError } from '@common/domain/errors';
import { CanalRegistro, TipoRegistroTanqueo } from '../enums';
import { assertTipoYCanalRegistro } from './tanqueo-registro.policies';

describe('assertTipoYCanalRegistro', () => {
  it('rechaza canal distinto de MOVIL o WEB', () => {
    expect(() =>
      assertTipoYCanalRegistro({
        tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
        canalRegistro: 'TELEFONO' as CanalRegistro,
        conductorRealId: null,
      })
    ).toThrow(BadInputError);
  });

  it('rechaza CONDUCTOR con conductorRealId presente', () => {
    expect(() =>
      assertTipoYCanalRegistro({
        tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
        canalRegistro: CanalRegistro.MOVIL,
        conductorRealId: 99,
      })
    ).toThrow(BadInputError);
  });

  it('rechaza COORDINADOR sin conductorRealId', () => {
    expect(() =>
      assertTipoYCanalRegistro({
        tipoRegistro: TipoRegistroTanqueo.COORDINADOR,
        canalRegistro: CanalRegistro.WEB,
        conductorRealId: null,
      })
    ).toThrow(BadInputError);
  });

  it('acepta CONDUCTOR sin conductorRealId', () => {
    expect(() =>
      assertTipoYCanalRegistro({
        tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
        canalRegistro: CanalRegistro.WEB,
        conductorRealId: null,
      })
    ).not.toThrow();
  });

  it('acepta COORDINADOR con conductorRealId', () => {
    expect(() =>
      assertTipoYCanalRegistro({
        tipoRegistro: TipoRegistroTanqueo.COORDINADOR,
        canalRegistro: CanalRegistro.WEB,
        conductorRealId: 42,
      })
    ).not.toThrow();
  });
});
