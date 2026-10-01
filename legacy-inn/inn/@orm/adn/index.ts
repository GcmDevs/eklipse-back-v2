import { CentroOrm } from './centro.orm';
import { IngresoOrm } from './ingreso.orm';

export * from './ingreso.orm';
export * from './centro.orm';

export const ORM_COMMON_ADN_ENTITIES = [
  //
  IngresoOrm,
  CentroOrm,
];
