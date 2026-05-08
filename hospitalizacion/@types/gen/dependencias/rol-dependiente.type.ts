import { CtmType } from '@common/domain/types';

export type RolDependienteCode = 1 | 2 | 3 | 4 | 5;

export class RolDependienteType extends CtmType<RolDependienteCode> {}

const DIRECTOR = new RolDependienteType(1, 'DIRECTOR');
const SUBDIRECTOR = new RolDependienteType(2, 'SUBDIRECTOR');
const COORDINADOR = new RolDependienteType(3, 'COORDINADOR');
const LIDER = new RolDependienteType(4, 'LIDER');
const COLABORADOR = new RolDependienteType(5, 'COLABORADOR');

export function rolDependienteTypeFactory(code: RolDependienteCode): RolDependienteType {
  switch (code) {
    case 1:
      return DIRECTOR;
    case 2:
      return SUBDIRECTOR;
    case 3:
      return COORDINADOR;
    case 4:
      return LIDER;
    case 5:
      return COLABORADOR;
  }
}

export const ROL_DEPENDIENTES = { DIRECTOR, SUBDIRECTOR, COORDINADOR, LIDER, COLABORADOR };

export const ROL_DEPENDIENTES_VALUES = [DIRECTOR, SUBDIRECTOR, COORDINADOR, LIDER, COLABORADOR];
