import { CtmType } from '@common/domain/types';

export type LineaCode = 1 | 2 | 3 | 4;

export class LineaType extends CtmType<LineaCode> {}

const ONCOLOGICO = new LineaType(1, 'ONCOLOGICO');
const NO_ONCOLOGICO = new LineaType(2, 'NO ONCOLOGICO');
const NUTRICION_PARENTERAL = new LineaType(3, 'NUTRICION PARENTERAL');
const REEMPAQUE_REENVASE = new LineaType(4, 'REEMPAQUE/REENVASE');

export function lineaTypeFactory(code: LineaCode): LineaType {
  switch (code) {
    case 1:
      return ONCOLOGICO;
    case 2:
      return NO_ONCOLOGICO;
    case 3:
      return NUTRICION_PARENTERAL;
    case 4:
      return REEMPAQUE_REENVASE;
  }
}

export const LINEAS_VALUES = [ONCOLOGICO, NO_ONCOLOGICO, NUTRICION_PARENTERAL, REEMPAQUE_REENVASE];

export const LINEAS = { ONCOLOGICO, NO_ONCOLOGICO, NUTRICION_PARENTERAL, REEMPAQUE_REENVASE };
