import { ORM_DIE_ENTITIES } from './dietas/infrastructure/models/diets';
import { ORM_HPN_DIETAS_ENTITIES } from './dietas/infrastructure/models/local';

/** @deprecated */
export const ORM_ORI_IMPORTS_ENTITIES = [...ORM_DIE_ENTITIES, ...ORM_HPN_DIETAS_ENTITIES];
