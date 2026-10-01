import { CtmType } from '@common/domain/types';

export type TipoProductoCode = 1 | 2;

export class TipoProductoType extends CtmType<TipoProductoCode> {}

const REACTIVO = new TipoProductoType(1, 'REACTIVO');
const DISPOSITIVO = new TipoProductoType(2, 'DISPOSITIVO');

export function tipoProductoFactory(code: TipoProductoCode): TipoProductoType {
  switch (code) {
    case 1:
      return REACTIVO;
    case 2:
      return DISPOSITIVO;
  }
}

export const TIPO_PRODUCTO = {
  REACTIVO,
  DISPOSITIVO,
};
export const TIPO_PRODUCTO_VALUES = [REACTIVO, DISPOSITIVO];

export type TipoEventoCode = 1 | 2;

export class TipoEventoType extends CtmType<TipoEventoCode> {}

const ALERTA_SANITARIA = new TipoEventoType(1, 'ALERTA SANITARIA');
const INFORME_SEGURIDAD = new TipoEventoType(2, 'INFORME DE SEGURIDAD');

export function tipoEventoFactory(code: TipoEventoCode): TipoEventoType {
  switch (code) {
    case 1:
      return ALERTA_SANITARIA;
    case 2:
      return INFORME_SEGURIDAD;
  }
}

export const TIPO_EVENTO = {
  ALERTA_SANITARIA,
  INFORME_SEGURIDAD,
};
export const TIPO_EVENTO_VALUES = [ALERTA_SANITARIA, INFORME_SEGURIDAD];
