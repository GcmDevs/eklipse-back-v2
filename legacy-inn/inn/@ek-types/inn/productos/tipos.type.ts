import { CtmType } from '@common/domain/types';

export type TipoProductoCode = 0 | 1 | 2;

export class TipoProductoType extends CtmType<TipoProductoCode> {}

const ninguno = new TipoProductoType(0, 'NINGUNO');
const suministro = new TipoProductoType(1, 'SUMINISTRO');
const medicamento = new TipoProductoType(2, 'MEDICAMENTO');

export const tipoProductoTypeFactory = (code: TipoProductoCode): TipoProductoType => {
  switch (code) {
    case 0:
      return ninguno;
    case 1:
      return suministro;
    case 2:
      return medicamento;
  }
};

export const TIPOS_PRODUCTO = { ninguno, suministro, medicamento };
