import { CtmType } from '@common/domain/types';

export type TipoProductoCode = 1 | 2 | 3;

export class TipoProductoType extends CtmType<TipoProductoCode> {}

const MEDICAMENTO = new TipoProductoType(1, 'MEDICAMENTO');
const DISPOSITIVO = new TipoProductoType(2, 'DISPOSITIVO');
const REACTIVO = new TipoProductoType(3, 'REACTIVO');

export const tipoProductoTypeFactory = (code: TipoProductoCode): TipoProductoType => {
  switch (code) {
    case 1:
      return MEDICAMENTO;
    case 2:
      return DISPOSITIVO;
    case 3:
      return REACTIVO;
  }
};

export const TIPOS_PRODUCTO = {
  MEDICAMENTO,
  DISPOSITIVO,
  REACTIVO,
};

export const TIPOS_PRODUCTO_VALUES = [MEDICAMENTO, DISPOSITIVO, REACTIVO];
