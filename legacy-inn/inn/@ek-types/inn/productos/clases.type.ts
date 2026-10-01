import { CtmType } from '@common/domain/types';

export type ClaseProductoCode = 0 | 1;

export class ClaseProductoType extends CtmType<ClaseProductoCode> {}

const productos = new ClaseProductoType(0, 'PRODUCTOS');
const servicios = new ClaseProductoType(1, 'SERVICIOS');

export function claseProductoTypeFactory(code: ClaseProductoCode): ClaseProductoType {
  switch (code) {
    case 0:
      return productos;
    case 1:
      return servicios;
  }
}

export const CLASES_PRODUCTO = { productos, servicios };

export const CLASE_PRODUCTO_VALUES = [productos, servicios];
