import { CentroOrm } from './centro.orm';
import { IngresoOrm } from './ingreso.orm';

export * from './ingreso.orm';
export * from './centro.orm';

export const ADN_ENTITIES = [IngresoOrm, CentroOrm];
