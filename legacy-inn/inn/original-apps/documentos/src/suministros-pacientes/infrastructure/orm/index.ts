import { ORM_INN_DOCS_SUMPAC_DEV_CTM_ENTITIES } from './devolucion-custom';
import { ORM_INN_DOCS_SUMPAC_DEV_TRAD_ENTITIES } from './devolucion-tradicional';

export const ORM_INN_DOCS_SUMPAC_ENTITIES = [
  ...ORM_INN_DOCS_SUMPAC_DEV_TRAD_ENTITIES,
  ...ORM_INN_DOCS_SUMPAC_DEV_CTM_ENTITIES,
];
