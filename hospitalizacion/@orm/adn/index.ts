import { CentroOrm } from './centro.orm';
import { IngresoOrm } from './ingreso.orm';

export * from './centro.orm';
export * from './ingreso.orm';

export const ORM_ADN_ENTITIES = [
  // --- AVOID NOWRAP --- //
  CentroOrm,
  IngresoOrm,
];
