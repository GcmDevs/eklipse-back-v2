import { CtmType } from '@common/domain/types';

export type ClaseMouseCode = 1 | 2;

export class ClaseMouseType extends CtmType<ClaseMouseCode> {}

const inalambrica = new ClaseMouseType(1, 'INALAMBRICA');
const optico = new ClaseMouseType(2, 'OPTICO');

export function claseMouseTypeFactory(code: ClaseMouseCode): ClaseMouseType {
  switch (code) {
    case 1:
      return inalambrica;
    case 2:
      return optico;
  }
}

export const CLASE_MOUSES = { inalambrica, optico };

export const CLASE_MOUSES_VALUES = [inalambrica, optico];
