import { CtmType } from '@common/domain/types';

export type TipoDevolucionCode = 1 | 2;

export class TipoDevolucionType extends CtmType<TipoDevolucionCode> {}

const DEVOLUCION_MEZCLA = new TipoDevolucionType(1, 'DEVOLUCIÓN MEZCLAS');
const DEMANDA_INSATISFECHA = new TipoDevolucionType(2, 'DEMANDA INSATISFECHA');

export const tipoDevolucionTypeFactory = (code: TipoDevolucionCode): TipoDevolucionType => {
  switch (code) {
    case 1:
      return DEVOLUCION_MEZCLA;
    case 2:
      return DEMANDA_INSATISFECHA;
  }
};

export const TIPOS_DEVOLUCION = {
  DEVOLUCION_MEZCLA,
  DEMANDA_INSATISFECHA,
};

export const TIPOS_DEVOLUCION_VALUES = [DEVOLUCION_MEZCLA, DEMANDA_INSATISFECHA];
