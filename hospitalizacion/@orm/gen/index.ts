import { ORM_GEN_CONTRATOS_ENTITIES } from './contratos';
import { ORM_GEN_PACIENTES_ENTITIES } from './pacientes';
import { ORM_GEN_TERCEROS_ENTITIES } from './terceros';
import { ORM_GEN_USUARIOS_ENTITIES } from './usuarios';
import { DependenciaOrm } from './dependencia.orm';

export * from './dependencia.orm';

export const ORM_GEN_ENTITIES = [
  ...ORM_GEN_CONTRATOS_ENTITIES,
  ...ORM_GEN_USUARIOS_ENTITIES,
  ...ORM_GEN_PACIENTES_ENTITIES,
  ...ORM_GEN_TERCEROS_ENTITIES,
  DependenciaOrm,
];
