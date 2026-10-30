import { GcmContexts } from '@common/application/constants';
import { ForbiddenAccessError } from '@common/domain/errors';
import { TipoRegistroTanqueo } from '../enums';
import { resolveRegistroTanqueoSede } from './tanqueo-sede-transversal.policies';

describe('resolveRegistroTanqueoSede', () => {
  const sesion = GcmContexts.ALTACENTRO;

  it('rechaza sedeDestino en registro local', () => {
    expect(() =>
      resolveRegistroTanqueoSede({
        contextoSesion: sesion,
        sedeDestino: GcmContexts.SANJUAN,
        hasRegistrarTransversal: false,
        tipoRegistro: TipoRegistroTanqueo.COORDINADOR,
        conductorRealOid: 1,
      })
    ).toThrow(ForbiddenAccessError);
  });

  it('exige COORDINADOR y conductor en transversal', () => {
    expect(() =>
      resolveRegistroTanqueoSede({
        contextoSesion: sesion,
        sedeDestino: GcmContexts.SANJUAN,
        hasRegistrarTransversal: true,
        tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
        conductorRealOid: null,
      })
    ).toThrow(/COORDINADOR/);
  });

  it('acepta transversal con permiso y sede distinta', () => {
    const plan = resolveRegistroTanqueoSede({
      contextoSesion: sesion,
      sedeDestino: GcmContexts.SANJUAN,
      hasRegistrarTransversal: true,
      tipoRegistro: TipoRegistroTanqueo.COORDINADOR,
      conductorRealOid: 10,
    });
    expect(plan.esTransversal).toBe(true);
    expect(plan.sedeEfectiva).toBe(GcmContexts.SANJUAN);
  });

  it('registro local sin sedeDestino usa sede de sesión', () => {
    const plan = resolveRegistroTanqueoSede({
      contextoSesion: sesion,
      hasRegistrarTransversal: false,
      tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
      conductorRealOid: null,
    });
    expect(plan.esTransversal).toBe(false);
    expect(plan.sedeEfectiva).toBe(sesion);
  });
});
