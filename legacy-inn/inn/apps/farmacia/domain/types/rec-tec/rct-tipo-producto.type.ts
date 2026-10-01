import { CtmType } from '@common/domain/types';

export type RCTTipoProductoCode = 1 | 2 | 3;

export class RCTTipoProductoType extends CtmType<RCTTipoProductoCode> {}

const medicamento = new RCTTipoProductoType(1, 'MEDICAMENTO');
const dispositivo = new RCTTipoProductoType(2, 'DISPOSITIVO');
const reactivo = new RCTTipoProductoType(3, 'REACTIVO');

export const RCTTipoProductoTypeFactory = (code: RCTTipoProductoCode): RCTTipoProductoType => {
  switch (code) {
    case 1:
      return medicamento;
    case 2:
      return dispositivo;
    case 3:
      return reactivo;
  }
};

export const RCT_TIPOS_PRODUCTO = {
  medicamento,
  dispositivo,
  reactivo,
};

export const RCT_TIPOS_PRODUCTO_VALUES = [medicamento, dispositivo, reactivo];
