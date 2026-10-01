import { CtmType } from '@common/domain/types';

export type TipoMtoCode = 0 | 1;

export class TipoMtoType extends CtmType<TipoMtoCode> {}

const correctivo = new TipoMtoType(0, 'CORRECTIVO');
const preventivo = new TipoMtoType(1, 'PREVENTIVO');

export function tipoMtoTypeFactory(code: TipoMtoCode): TipoMtoType {
  switch (code) {
    case 0:
      return correctivo;
    case 1:
      return preventivo;
  }
}

export const TIPOS_MTOS = { correctivo, preventivo };

export const TIPOS_MTOS_VALUES = [correctivo, preventivo];
