import { CtmType } from '@common/domain/types';

export type TipoPersonaCode = 1 | 2;

const JURIDICA = new CtmType<TipoPersonaCode>(1, 'JURIDICA');
const NATURAL = new CtmType<TipoPersonaCode>(2, 'NATURAL');

export function tipoPersonaTypeFactory(code: TipoPersonaCode): CtmType<TipoPersonaCode> {
  switch (code) {
    case 1:
      return JURIDICA;
    case 2:
      return NATURAL;
  }
}

export const TIPOS_PERSONA_VALUES = [JURIDICA, NATURAL];

export const TIPOS_PERSONA = { JURIDICA, NATURAL };
