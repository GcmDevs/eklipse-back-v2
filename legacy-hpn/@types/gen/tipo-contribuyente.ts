import { CtmType } from '@common/domain/types';

export type TipoContribuyenteCode = 0 | 1 | 2 | 3;

const REGIMEN_SIMPLIFICADO = new CtmType<TipoContribuyenteCode>(0, 'REGIMEN SIMPLIFICADO');
const REGIMEN_COMUN = new CtmType<TipoContribuyenteCode>(1, 'REGIMEN COMÚN');
const GRAN_CONTRIBUYENTE = new CtmType<TipoContribuyenteCode>(2, 'GRAN CONTRIBUYENTE');
const EMPRESA_ESTATAL = new CtmType<TipoContribuyenteCode>(3, 'EMPRESA ESTATAL');

export function tipoContribuyenteTypeFactory(
  code: TipoContribuyenteCode
): CtmType<TipoContribuyenteCode> {
  switch (code) {
    case 0:
      return REGIMEN_SIMPLIFICADO;
    case 2:
      return GRAN_CONTRIBUYENTE;
    case 1:
      return REGIMEN_COMUN;
    case 3:
      return EMPRESA_ESTATAL;
  }
}

export const TIPOS_CONTRIBUYENTE_VALUES = [
  REGIMEN_SIMPLIFICADO,
  REGIMEN_COMUN,
  GRAN_CONTRIBUYENTE,
  EMPRESA_ESTATAL,
];

export const TIPOS_CONTRIBUYENTE = {
  REGIMEN_SIMPLIFICADO,
  REGIMEN_COMUN,
  GRAN_CONTRIBUYENTE,
  EMPRESA_ESTATAL,
};
