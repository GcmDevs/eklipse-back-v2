import { ORM_HPN_CAMAS_ENTITIES } from './camas';
import { EstanciaOrm } from './estancia.orm';

export * from './camas';
export * from './estancia.orm';

export const ORM_HPN_ENTITIES = [
  // --- AVOID NOWRAP --- //
  ...ORM_HPN_CAMAS_ENTITIES,
  EstanciaOrm,
];
