import { CtmType } from '@common/domain/types';

export type JornadaCode = 1 | 2 | 3;

export class JornadaType extends CtmType<JornadaCode> {}

export const DESAYUNO = new JornadaType(1, 'DESAYUNO');
export const ALMUERZO = new JornadaType(2, 'ALMUERZO');
export const CENA = new JornadaType(3, 'CENA');

export function jornadasDietaTypeFactory(code: JornadaCode): JornadaType {
  switch (code) {
    case 1:
      return DESAYUNO;
    case 2:
      return ALMUERZO;
    case 3:
      return CENA;
  }
}

export function jornadasDietaTypeFactoryByNameForHumans(code: string): JornadaType {
  switch (code) {
    case DESAYUNO.getForHumans():
      return DESAYUNO;
    case ALMUERZO.getForHumans():
      return ALMUERZO;
    case CENA.getForHumans():
      return CENA;
  }
}

export const JORNADAS_DIETA = { DESAYUNO, ALMUERZO, CENA };

export const JORNADAS_DIETA_VALUES = [DESAYUNO, ALMUERZO, CENA];
