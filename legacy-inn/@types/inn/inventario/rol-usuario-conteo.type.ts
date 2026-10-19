import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type RolUsuarioConteoCode = 1 | 2 | 3;

export class RolUsuarioConteoType extends CtmType<RolUsuarioConteoCode> {}

const CONTEO_I = new RolUsuarioConteoType(1, 'CONTEO I');
const CONTEO_II = new RolUsuarioConteoType(2, 'CONTEO II');
const CONTEO_III = new RolUsuarioConteoType(3, 'CONTEO III');

export function rolUsuarioConteooTypeFactory(
  code: RolUsuarioConteoCode,
  throwErr = true
): RolUsuarioConteoType {
  switch (code) {
    case 1:
      return CONTEO_I;
    case 2:
      return CONTEO_II;
    case 3:
      return CONTEO_III;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return DEFAULT_TYPE;
      else if (throwErr) throw new Error('No existe rol de usuario de conteos con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const ROL_CONTEO_USUARIO = { CONTEO_I, CONTEO_II, CONTEO_III };

export const ROL_CONTEO_USUARIO_VALUES = [CONTEO_I, CONTEO_II, CONTEO_III];
