import { ForbiddenAccessError } from '@common/domain/errors';
import { TipoRegistroTanqueo } from '../enums';
import {
  assertReponerAuthorityIfRequired,
  requiresReponerPermission,
} from './tanqueo-reponer.policies';

describe('requiresReponerPermission', () => {
  it('es true para COORDINADOR', () => {
    expect(requiresReponerPermission({ tipoRegistro: TipoRegistroTanqueo.COORDINADOR, conductorRealOid: null })).toBe(true);
  });

  it('es true cuando viene conductorRealOid aunque sea CONDUCTOR', () => {
    expect(requiresReponerPermission({ tipoRegistro: TipoRegistroTanqueo.CONDUCTOR, conductorRealOid: 7 })).toBe(true);
  });

  it('es false para CONDUCTOR sin conductorRealOid', () => {
    expect(requiresReponerPermission({ tipoRegistro: TipoRegistroTanqueo.CONDUCTOR, conductorRealOid: null })).toBe(false);
  });

  it('es false cuando no hay datos', () => {
    expect(requiresReponerPermission({})).toBe(false);
  });
});

describe('assertReponerAuthorityIfRequired', () => {
  it('lanza ForbiddenAccessError si se requiere REPONER y no se tiene', () => {
    expect(() =>
      assertReponerAuthorityIfRequired(false, {
        tipoRegistro: TipoRegistroTanqueo.COORDINADOR,
        conductorRealOid: null,
      })
    ).toThrow(ForbiddenAccessError);
  });

  it('no lanza si no se requiere REPONER', () => {
    expect(() =>
      assertReponerAuthorityIfRequired(false, {
        tipoRegistro: TipoRegistroTanqueo.CONDUCTOR,
        conductorRealOid: null,
      })
    ).not.toThrow();
  });

  it('no lanza si se requiere y se tiene la autoridad', () => {
    expect(() =>
      assertReponerAuthorityIfRequired(true, { conductorRealOid: 3 })
    ).not.toThrow();
  });
});
