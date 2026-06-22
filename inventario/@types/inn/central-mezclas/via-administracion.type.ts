import { CtmType } from '@common/domain/types';

export type ViaAdministracionCode = 1 | 2 | 3 | 4;

export class ViaAdministracionType extends CtmType<ViaAdministracionCode> {}

const IV = new ViaAdministracionType(1, 'IV');
const IM = new ViaAdministracionType(2, 'IM');
const SC = new ViaAdministracionType(3, 'SC');
const IT = new ViaAdministracionType(4, 'IT');

export function viaAdministracionTypeFactory(code: ViaAdministracionCode): ViaAdministracionType {
  switch (code) {
    case 1:
      return IV;
    case 2:
      return IM;
    case 3:
      return SC;
    case 4:
      return IT;
  }
}

export const VIAS_ADMINISTRACION_VALUES = [IV, IM, SC, IT];

export const VIAS_ADMINISTRACION = { IV, IM, SC, IT };
