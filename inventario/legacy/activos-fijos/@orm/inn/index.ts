import { ORM_AFN_ENTITIES } from './activos-fijos';
import { ORM_AFN_SVT_ENTITIES } from './activos-fijos/servicio-tecnico';

export const LGC_AFN_INN_ENTITIES = [...ORM_AFN_ENTITIES, ...ORM_AFN_SVT_ENTITIES];
