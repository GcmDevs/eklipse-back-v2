import { CtmType } from '@common/domain/types';

export type GrupoEstanciaCode = 1 | 2 | 3 | 4;

export class GrupoEstanciaType extends CtmType<GrupoEstanciaCode> {}

const C1 = new GrupoEstanciaType(1, '1 A 6 DIAS');
const C2 = new GrupoEstanciaType(2, '7 A 14 DIAS');
const C3 = new GrupoEstanciaType(3, '15 A 29 DIAS');
const C4 = new GrupoEstanciaType(4, 'MAYOR A 30 DIAS');

export function grupoEstanciaTypeFactory(code: GrupoEstanciaCode): GrupoEstanciaType {
  switch (code) {
    case 1:
      return C1;
    case 2:
      return C2;
    case 3:
      return C3;
    case 4:
      return C4;
  }
}

export function grupoEstanciaTypeByDaysFactory(days: number): GrupoEstanciaType {
  if (days <= 6) return C1;
  else if (days > 6 && days <= 14) return C2;
  else if (days > 14 && days <= 29) return C3;
  else if (days >= 30) return C4;
  else return undefined!;
}

export const GRUPOS_ESTANCIA_VALUES = [C1, C2, C3, C4];

export const GRUPOS_ESTANCIA = { C1, C2, C3, C4 };
