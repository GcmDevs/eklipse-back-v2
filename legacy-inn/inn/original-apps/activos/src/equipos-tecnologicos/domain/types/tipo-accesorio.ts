import { CtmType } from '@common/domain/types';

export type TipoAccesorioCode = 0 | 1 | 2 | 3 | 4;

export class TipoAccesorioType extends CtmType<TipoAccesorioCode> {}

const accesorio = new TipoAccesorioType(0, 'ACCESORIO');
const parte = new TipoAccesorioType(1, 'PARTE O REPUESTO');

export function tipoAccesorioTypeFactory(code: TipoAccesorioCode): TipoAccesorioType {
  switch (code) {
    case 1:
      return accesorio;
    case 2:
      return parte;
  }
}

export const TIPO_ACCESORIOS = { accesorio, parte };

export const TIPO_ACCESORIOS_VALUES = [accesorio, parte];
