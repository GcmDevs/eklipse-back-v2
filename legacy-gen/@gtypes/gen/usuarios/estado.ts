import { CtmType } from '@common/domain/types';

export type EstadoUsuarioCode = 0 | 1 | 3 | 4 | 99;

export class EstadoUsuarioType extends CtmType<EstadoUsuarioCode> {}

const INACTIVO = new EstadoUsuarioType(0, 'INACTIVO');
const ACTIVO = new EstadoUsuarioType(1, 'ACTIVO');
const SUSPENDIDO = new EstadoUsuarioType(3, 'SUSPENDIDO');
const RETIRADO = new EstadoUsuarioType(4, 'RETIRADO');
const ACCESO_BLOQUEADO = new EstadoUsuarioType(99, 'ACCESO BLOQUEADO');

export function estadoUsuarioTypeFactory(code: EstadoUsuarioCode): EstadoUsuarioType {
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

export const ESTADOS_USUARIO = { INACTIVO, ACTIVO, SUSPENDIDO, RETIRADO, ACCESO_BLOQUEADO };

export const ESTADOS_USUARIO_VALUES = [INACTIVO, ACTIVO, SUSPENDIDO, RETIRADO, ACCESO_BLOQUEADO];
