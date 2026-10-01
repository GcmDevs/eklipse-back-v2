import { CtmType } from '@common/domain/types';

export type TipoEquipoCode = 1 | 2;

export class TipoEquipoType extends CtmType<TipoEquipoCode> {}

const portatil = new TipoEquipoType(1, 'portatil');
const escritorio = new TipoEquipoType(2, 'PC DE ESCRITORIO');

export function tipoEquipoTypeFactory(code: TipoEquipoCode): TipoEquipoType {
  switch (code) {
    case 1:
      return portatil;
    case 2:
      return escritorio;
  }
}

export const TIPO_EQUIPO = { portatil, escritorio };

export const TIPO_EQUIPO_VALUES = [portatil, escritorio];
