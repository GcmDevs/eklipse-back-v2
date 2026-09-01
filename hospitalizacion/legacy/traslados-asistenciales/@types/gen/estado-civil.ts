import { CtmType } from '@common/domain/types';

export type EstadoCivilCode = 0 | 1 | 2 | 3 | 4 | 5;

const NINGUNO = new CtmType<EstadoCivilCode>(0, 'NINGUNO');
const SOLTERO = new CtmType<EstadoCivilCode>(1, 'SOLTERO');
const CASADO = new CtmType<EstadoCivilCode>(2, 'CASADO');
const VIUDO = new CtmType<EstadoCivilCode>(3, 'VIUDO');
const UNION_LIBRE = new CtmType<EstadoCivilCode>(4, 'UNION LIBRE');
const SEPARADO = new CtmType<EstadoCivilCode>(5, 'SEPARADO');

export function estadoCivilTypeFactory(code: EstadoCivilCode): CtmType<EstadoCivilCode> {
  switch (code) {
    case 0:
      return NINGUNO;
    case 1:
      return SOLTERO;
    case 2:
      return CASADO;
    case 3:
      return VIUDO;
    case 4:
      return UNION_LIBRE;
    case 5:
      return SEPARADO;
  }
}

export const ESTADO_CIVIL_VALUES = [NINGUNO, SOLTERO, CASADO, VIUDO, UNION_LIBRE, SEPARADO];

export const ESTADO_CIVIL = {
  NINGUNO,
  SOLTERO,
  CASADO,
  VIUDO,
  UNION_LIBRE,
  SEPARADO,
};
