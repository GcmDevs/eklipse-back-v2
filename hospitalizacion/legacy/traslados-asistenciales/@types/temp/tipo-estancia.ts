import { CtmType } from '@common/domain/types';

export type TipoEstanciaCode = 0 | 1 | 2;

const NINGUNA = new CtmType<TipoEstanciaCode>(0, 'NINGUNA');
const ACTUAL = new CtmType<TipoEstanciaCode>(1, 'ACTUAL');
const TRASLADO = new CtmType<TipoEstanciaCode>(2, 'TRASLADO');

export function tipoEstanciaTypeFactory(code: TipoEstanciaCode): CtmType<TipoEstanciaCode> {
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

export const TIPOS_ESTANCIA = {
  NINGUNA,
  ACTUAL,
  TRASLADO,
};
