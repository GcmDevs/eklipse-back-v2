import { CamaOrm } from './cama.orm';
import { GrupoOrm } from './grupo.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { TipoCamaOrm } from './tipo.orm';

export * from './tipo.orm';
export * from './cama.orm';
export * from './grupo.orm';
export * from './subgrupo.orm';

export const ORM_HPN_CAMAS_ENTITIES = [
  // --- AVOID NOWRAP --- //
  CamaOrm,
  TipoCamaOrm,
  GrupoOrm,
  SubgrupoOrm,
];
