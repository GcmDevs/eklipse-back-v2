import { CtmType } from '@common/domain/types';

export type TipoDiscoDuroCode = 1 | 2;

export class TipoDiscoDuroType extends CtmType<TipoDiscoDuroCode> {}

const hdd = new TipoDiscoDuroType(1, 'HDD');
const ssd = new TipoDiscoDuroType(2, 'SSD');

export function tipoDiscoDuroTypeFactory(code: TipoDiscoDuroCode): TipoDiscoDuroType {
  switch (code) {
    case 1:
      return hdd;
    case 2:
      return ssd;
  }
}

export const TIPO_DISCO_DUROS = { hdd, ssd };

export const TIPO_DISCO_DUROS_VALUES = [hdd, ssd];
