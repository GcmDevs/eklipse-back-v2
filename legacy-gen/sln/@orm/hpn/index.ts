import { SubgrupoOrm } from './cama-subgrupo.orm';
import { CamaOrm } from './cama.orm';
import { EstanciaOrm } from './estancia.orm';

export * from './cama.orm';
export * from './estancia.orm';
export * from './cama-subgrupo.orm';

export const HPN_ENTITIES = [CamaOrm, SubgrupoOrm, EstanciaOrm];
