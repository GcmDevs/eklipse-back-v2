import { CtmType } from '@common/domain/types';

export type TipoReingresoCode = 1 | 2 | 3 | 4;

export class TipoReingresoType extends CtmType<TipoReingresoCode> {}

const INGR_NORMAL = new TipoReingresoType(1, 'INGRESO NORMAL');
const CORTE_FACT = new TipoReingresoType(2, 'CORTE FACTURACIÓN');
const REINGR_HOSP = new TipoReingresoType(3, 'REINGRESO HOSPITALIZACIÓN');
const REINGR_URG = new TipoReingresoType(4, 'REINGRESO URGENCIA');

export function tipoReingresoTypeFactory(code: TipoReingresoCode): TipoReingresoType {
  switch (code) {
    case 1:
      return INGR_NORMAL;
    case 2:
      return CORTE_FACT;
    case 3:
      return REINGR_HOSP;
    case 4:
      return REINGR_URG;
  }
}

export const TIPOS_REINGRESO_VALUES = [INGR_NORMAL, CORTE_FACT, REINGR_HOSP, REINGR_URG];

export const TIPOS_REINGRESO = { INGR_NORMAL, CORTE_FACT, REINGR_HOSP, REINGR_URG };
