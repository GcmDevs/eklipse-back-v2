import { CtmType } from '@common/domain/types';

export type RolDependenciaCode = 1 | 2 | 3 | 4 | 5;

export class RolDependenciaType extends CtmType<RolDependenciaCode> {}

const DIRECTOR = new RolDependenciaType(1, 'DIRECTOR');
const SUBDIRECTOR = new RolDependenciaType(2, 'SUBDIRECTOR');
const COORDINADOR = new RolDependenciaType(3, 'COORDINADOR');
const LIDER = new RolDependenciaType(4, 'LIDER');
const COLABORADOR = new RolDependenciaType(5, 'COLABORADOR');

export function rolDependenciaTypeFactory(code: RolDependenciaCode): RolDependenciaType {
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
