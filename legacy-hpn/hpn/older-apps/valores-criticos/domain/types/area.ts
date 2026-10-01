import { CtmType } from '@common/domain/types';

export type TipoAreaCode = 1 | 2 | 3 | 4 | 5 | 6;

export class TipoAreaType extends CtmType<TipoAreaCode> {}

const LABORATORIO = new TipoAreaType(1, 'LABORATORIO');
const IMAGENOLOGIA = new TipoAreaType(2, 'IMAGENOLOGÍA');
const TERAPIA = new TipoAreaType(3, 'TERAPIA');
const DIAGNOSTICO_CARDIOVASCULAR = new TipoAreaType(4, 'DIAGNÓSTICO CARDIOVASCULAR');
const GASTROENTEROLOGIA = new TipoAreaType(5, 'GASTROENTEROLOGIA');
const ELECTRODIGNOSTICO = new TipoAreaType(6, 'ELECTRODIAGNÓSTICO');

export function tipoAreaFactory(code: TipoAreaCode): TipoAreaType {
  switch (code) {
    case 1:
      return LABORATORIO;
    case 2:
      return IMAGENOLOGIA;
    case 3:
      return TERAPIA;
    case 4:
      return DIAGNOSTICO_CARDIOVASCULAR;
    case 5:
      return GASTROENTEROLOGIA;
    case 6:
      return ELECTRODIGNOSTICO;
  }
}

export const AREAS = {
  LABORATORIO,
  IMAGENOLOGIA,
  TERAPIA,
  DIAGNOSTICO_CARDIOVASCULAR,
  ELECTRODIGNOSTICO,
};
export const AREAS_VALUES = [
  LABORATORIO,
  IMAGENOLOGIA,
  TERAPIA,
  DIAGNOSTICO_CARDIOVASCULAR,
  GASTROENTEROLOGIA,
  ELECTRODIGNOSTICO,
];
