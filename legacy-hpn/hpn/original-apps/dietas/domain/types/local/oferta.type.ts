import { CtmType } from '@common/domain/types';
import { CONDICION_OFERTA, CondicionOfertaType } from './condicion-oferta.type';

export type OfertaCode = 2 | 3 | 9 | 10;

export class OfertaType extends CtmType<OfertaCode> {
  constructor(code: OfertaCode, forHumans: string, private type: CondicionOfertaType) {
    super(code, forHumans);
  }

  getType(): CondicionOfertaType {
    return this.type;
  }
}

const TIPO = new OfertaType(2, 'TIPO', CONDICION_OFERTA.MULTI);
const CONSISTENCIA = new OfertaType(3, 'CONSISTENCIA', CONDICION_OFERTA.SINGL);
const MERIENDA = new OfertaType(9, 'MERIENDA', CONDICION_OFERTA.SINGL);
const DIETA_FAMILIAR = new OfertaType(10, 'DIETA PARA FAMILIAR', CONDICION_OFERTA.SINGL_OPCIO);

export function ofertaTypeFactory(code: OfertaCode): OfertaType {
  switch (code) {
    case 2:
      return TIPO;
    case 3:
      return CONSISTENCIA;
    case 9:
      return MERIENDA;
    case 10:
      return DIETA_FAMILIAR;
  }
}

export const OFERTA = {
  CONSISTENCIA,
  TIPO,
  MERIENDA,
  DIETA_FAMILIAR,
};

export const OFERTA_VALUES = [CONSISTENCIA, TIPO, MERIENDA, DIETA_FAMILIAR];
