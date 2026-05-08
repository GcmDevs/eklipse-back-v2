import { CtmType } from '@common/domain/types';

export type TipoEstanciaCode = 0 | 1 | 2;

export class TipoEstanciaType extends CtmType<TipoEstanciaCode> {}

const NINGUNA = new TipoEstanciaType(0, 'NINGUNA');
const ACTUAL = new TipoEstanciaType(1, 'ACTUAL');
const TRASLADO = new TipoEstanciaType(2, 'TRASLADO');

export function tipoEstanciaTypeFactory(code: TipoEstanciaCode): TipoEstanciaType {
  switch (code) {
    case 0:
      return NINGUNA;
    case 1:
      return ACTUAL;
    case 2:
      return TRASLADO;
  }
}

export const TIPOS_ESTANCIA_VALUES = [NINGUNA, ACTUAL, TRASLADO];

export const TIPOS_ESTANCIA = { NINGUNA, ACTUAL, TRASLADO };
