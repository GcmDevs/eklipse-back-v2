import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type ClaseProductoCode = 0 | 1;

export class ClaseProductoType extends CtmType<ClaseProductoCode> {}

const PRODUCTOS = new ClaseProductoType(0, 'PRODUCTOS');
const SERVICIOS = new ClaseProductoType(1, 'SERVICIOS');

export function claseProductoTypeFactory(
  code: ClaseProductoCode,
  throwErr = true
): ClaseProductoType {
  switch (code) {
    case 0:
      return PRODUCTOS;
    case 1:
      return SERVICIOS;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe clase de producto con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const CLASES_PRODUCTO = { PRODUCTOS, SERVICIOS };

export const CLASE_PRODUCTO_VALUES = [PRODUCTOS, SERVICIOS];
