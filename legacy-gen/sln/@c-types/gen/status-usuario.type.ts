import { CtmType } from '@common/domain/types';

export type UserStatusCode = 0 | 1 | 3 | 4 | 99;

export class UserStatusType extends CtmType<UserStatusCode> {}

const INACTIVO = new UserStatusType(0, 'INACTIVO');
const ACTIVO = new UserStatusType(1, 'ACTIVO');
const SUSPENDIDO = new UserStatusType(3, 'SUSPENDIDO');
const RETIRADO = new UserStatusType(4, 'RETIRADO');
const ACCESO_BLOQUEADO = new UserStatusType(99, 'ACCESO BLOQUEADO');

export function userStatusTypeFactory(code: UserStatusCode): UserStatusType {
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
