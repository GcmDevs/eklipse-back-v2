import { CtmType } from '@common/domain/types';

export type TipoHospitalizacionCode = 1 | 2 | 3;

export class TipoHospitalizacionType extends CtmType<TipoHospitalizacionCode> {}

const HPN_NO_QUIR = new TipoHospitalizacionType(1, 'HOSPITALIZACIÓN NO QUIRURGICA');
const HPN_OBSTETR = new TipoHospitalizacionType(2, 'HOSPITALIZACIÓN OBSTETRICA');
const HPN_QUIRURG = new TipoHospitalizacionType(3, 'HOSPITALIZACIÓN QUIRURGICA');

export function tipoHospitalizacionTypeFactory(
  code: TipoHospitalizacionCode
): TipoHospitalizacionType {
  switch (code) {
    case 1:
      return HPN_NO_QUIR;
    case 2:
      return HPN_OBSTETR;
    case 3:
      return HPN_QUIRURG;
  }
}

export const TIPO_HOSPITALIZACION_VALUES = [HPN_NO_QUIR, HPN_OBSTETR, HPN_QUIRURG];

export const TIPO_HOSPITALIZACION = { HPN_NO_QUIR, HPN_OBSTETR, HPN_QUIRURG };
