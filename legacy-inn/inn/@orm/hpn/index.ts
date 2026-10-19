import { CamaOrm } from './cama.orm';
import { EstanciaOrm } from './estancia.orm';
import { SubgrupoOrm } from './subgrupo.orm';

export * from './cama.orm';
export * from './estancia.orm';
export * from './subgrupo.orm';

export const ORM_COMMON_HPN_ENTITIES = [
  //
  CamaOrm,
  EstanciaOrm,
  SubgrupoOrm,
];
