import { CtmType } from '@common/domain/types';

export type VehiculoCode = 1 | 2 | 3;

export class VehiculoType extends CtmType<VehiculoCode> {}

const SSN_09 = new VehiculoType(1, 'SSN 0,9%');
const API = new VehiculoType(2, 'API');
const DAD_5 = new VehiculoType(3, 'DAD 5%');

export function vehiculoTypeFactory(code: VehiculoCode): VehiculoType {
  switch (code) {
    case 1:
      return SSN_09;
    case 2:
      return API;
    case 3:
      return DAD_5;
  }
}

export const VEHICULOS_VALUES = [SSN_09, API, DAD_5];

export const VEHICULOS = { SSN_09, API, DAD_5 };
