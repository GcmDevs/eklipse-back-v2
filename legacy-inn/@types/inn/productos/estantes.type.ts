import { CtmType, DEFAULT_TYPE } from '@common/domain/types';

export type TipoEstanteCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export class TipoEstanteType extends CtmType<TipoEstanteCode> {}

const NEVERA = new TipoEstanteType(1, 'NEVERA');
const GENERAL = new TipoEstanteType(2, 'GENERAL');
const ALTO_COSTO = new TipoEstanteType(3, 'ALTO COSTO');
const CONTROL_ESPECIAL = new TipoEstanteType(4, 'CONTROL ESPECIAL');
const ONCOLOGICO = new TipoEstanteType(5, 'ONCOLOGICO');
const TABLETERIA = new TipoEstanteType(6, 'TABLETERIA');
const NUTRICIONAL = new TipoEstanteType(7, 'NUTRICIONAL');
const LIQUIDO = new TipoEstanteType(8, 'LIQUIDO');

export function tipoEstanteTypeFactory(code: TipoEstanteCode, throwErr = true): TipoEstanteType {
  switch (code) {
    case 1:
      return NEVERA;
    case 2:
      return GENERAL;
    case 3:
      return ALTO_COSTO;
    case 4:
      return CONTROL_ESPECIAL;
    case 5:
      return ONCOLOGICO;
    case 6:
      return TABLETERIA;
    case 7:
      return NUTRICIONAL;
    case 8:
      return LIQUIDO;
    default: {
      if ([null, undefined].indexOf(code) >= 0) return null;
      else if (throwErr) throw new Error('No existe tipo de estante con este codigo');
      else return DEFAULT_TYPE;
    }
  }
}

export const TIPOS_ESTANTE = {
  NEVERA,
  GENERAL,
  ALTO_COSTO,
  CONTROL_ESPECIAL,
  ONCOLOGICO,
  TABLETERIA,
  NUTRICIONAL,
  LIQUIDO,
};

export const TIPOS_ESTANTE_VALUES = [
  NEVERA,
  GENERAL,
  ALTO_COSTO,
  CONTROL_ESPECIAL,
  ONCOLOGICO,
  TABLETERIA,
  NUTRICIONAL,
  LIQUIDO,
];
