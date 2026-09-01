import { CtmType } from '@common/domain/types';

export type TipoAfiliadoCode = 0 | 1 | 2 | 3 | 4 | 5;

const NINGUNO = new CtmType<TipoAfiliadoCode>(0, 'NINGUNO');
const COTIZANTE = new CtmType<TipoAfiliadoCode>(1, 'COTIZANTE');
const BENEFICIARIO = new CtmType<TipoAfiliadoCode>(2, 'BENEFICIARIO');
const ADICIONAL = new CtmType<TipoAfiliadoCode>(3, 'ADICIONAL');
const JUBILADO_RETIRADO = new CtmType<TipoAfiliadoCode>(4, 'JUBILADO RETIRADO');
const PENSIONADO = new CtmType<TipoAfiliadoCode>(5, 'PENSIONADO');

export function tipoAfiliadoTypeFactory(code: TipoAfiliadoCode): CtmType<TipoAfiliadoCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return COTIZANTE;
    case 2:
      return BENEFICIARIO;
    case 3:
      return ADICIONAL;
    case 4:
      return JUBILADO_RETIRADO;
    case 5:
      return PENSIONADO;
  }
}

export const TIPOS_AFILIADO_VALUES = [
  NINGUNO,
  COTIZANTE,
  BENEFICIARIO,
  ADICIONAL,
  JUBILADO_RETIRADO,
  PENSIONADO,
];

export const TIPOS_AFILIADO = {
  NINGUNO,
  COTIZANTE,
  BENEFICIARIO,
  ADICIONAL,
  JUBILADO_RETIRADO,
  PENSIONADO,
};
