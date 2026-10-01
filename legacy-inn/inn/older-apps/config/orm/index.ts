import { CentroOrm } from './centro.orm';
import { CommonCentroOrm } from './common-centro.orm';

export * from './centro.orm';
export * from './common-centro.orm';

export const ORM_CONFIG_ENTITIES = [CommonCentroOrm, CentroOrm];
