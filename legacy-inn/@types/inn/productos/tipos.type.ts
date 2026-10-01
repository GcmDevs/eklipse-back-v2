import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type TipoProductoCode = 0 | 1 | 2;

export class TipoProductoType extends CtmType<TipoProductoCode> {}

const NINGUNO = new TipoProductoType(0, 'NINGUNO');
const SUMINISTRO = new TipoProductoType(1, 'SUMINISTRO');
const MEDICAMENTO = new TipoProductoType(2, 'MEDICAMENTO');

export const tipoProductoTypeFactory = (
  code: TipoProductoCode,
  throwErr = true
): TipoProductoType => {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return SUMINISTRO;
    case 2:
      return MEDICAMENTO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe tipo de producto con este codigo');
      else return DEFAULT_TYPE;
    }
  }
};

export const TIPOS_PRODUCTO = { NINGUNO, SUMINISTRO, MEDICAMENTO };
