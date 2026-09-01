import { CtmType } from '@common/domain/types';

export type UserStatusCode = 0 | 1 | 3 | 4 | 99;

const INACTIVO = new CtmType<UserStatusCode>(0, 'INACTIVO');
const ACTIVO = new CtmType<UserStatusCode>(1, 'ACTIVO');
const SUSPENDIDO = new CtmType<UserStatusCode>(3, 'SUSPENDIDO');
const RETIRADO = new CtmType<UserStatusCode>(4, 'RETIRADO');
const ACCESO_BLOQUEADO = new CtmType<UserStatusCode>(99, 'ACCESO BLOQUEADO');

export function userStatusTypeFactory(code: UserStatusCode): CtmType<UserStatusCode> {
  switch (code) {
    case 0:
      return INACTIVO;
    case 1:
      return ACTIVO;
    case 3:
      return SUSPENDIDO;
    case 4:
      return RETIRADO;
    case 99:
      return ACCESO_BLOQUEADO;
  }
}

export const USER_STATUS_VALUES = [INACTIVO, ACTIVO, SUSPENDIDO, RETIRADO, ACCESO_BLOQUEADO];

export const USER_STATUS = { INACTIVO, ACTIVO, SUSPENDIDO, RETIRADO, ACCESO_BLOQUEADO };
