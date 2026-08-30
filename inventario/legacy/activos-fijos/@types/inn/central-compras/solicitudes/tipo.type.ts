import { CtmType } from '@common/domain/types';

export type TipoCode = 1 | 2 | 3 | 4;

export class TipoType extends CtmType<TipoCode> {}

const PRODUCTOS = new TipoType(1, 'PRODUCTOS');
const SERVICIOS = new TipoType(2, 'SERVICIOS');
const ACTIVO_FIJO = new TipoType(3, 'ACTIVOS FIJOS');
const MEDICAMENTOS = new TipoType(4, 'MEDICAMENTOS');

export function tipoTypeFactory(code: TipoCode): TipoType {
  switch (code) {
    case 1:
      return PRODUCTOS;
    case 2:
      return SERVICIOS;
    case 3:
      return ACTIVO_FIJO;
    case 4:
      return MEDICAMENTOS;
  }
}

export const TIPOS = { PRODUCTOS, SERVICIOS, ACTIVO_FIJO, MEDICAMENTOS };

export const TIPOS_VALUES = [PRODUCTOS, SERVICIOS, ACTIVO_FIJO, MEDICAMENTOS];

export const TIPOS_CODES_VALUES = [PRODUCTOS.getCode(), SERVICIOS.getCode(), ACTIVO_FIJO.getCode()];
