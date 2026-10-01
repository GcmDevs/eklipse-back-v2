import { CtmType } from '@common/domain/types';

export type TipoManualCode = 0 | 1 | 2 | 3 | 4;

export class TipoManualType extends CtmType<TipoManualCode> {}

const INTRUCCIONES = new TipoManualType(0, 'INTRUCCIONES');
const TECNICO = new TipoManualType(1, 'TECNICO');
const AMBOS = new TipoManualType(2, 'AMBOS');
const NINGUNO = new TipoManualType(3, 'NINGUNO');
const USO = new TipoManualType(4, 'USO');

export function tipoManualTypeFactory(code: TipoManualCode): TipoManualType {
  switch (code) {
    case 0:
      return INTRUCCIONES;
    case 1:
      return TECNICO;
    case 2:
      return AMBOS;
    case 3:
      return NINGUNO;
    case 4:
      return USO;
  }
}

export const TIPO_MANUALES = { INTRUCCIONES, TECNICO, AMBOS, NINGUNO, USO };

export const TIPO_MANUALES_VALUES = [INTRUCCIONES, TECNICO, AMBOS, NINGUNO, USO];
