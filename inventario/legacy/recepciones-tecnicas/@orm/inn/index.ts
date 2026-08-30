import { LGC_RCT_DOCUMENTO_ENTITIES } from './documentos';
import { ORM_RECTEC_ENTITIES } from './farmacia/recepcion-tecnica';
import { LGC_RCT_PRODUCTO_ENTITIES } from './productos';

export const LGC_RCT_INN_ENTITIES = [
  ...LGC_RCT_DOCUMENTO_ENTITIES,
  ...ORM_RECTEC_ENTITIES,
  ...LGC_RCT_PRODUCTO_ENTITIES,
];
