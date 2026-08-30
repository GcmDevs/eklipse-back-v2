import { ORM_AFN_ENTITIES } from './activos-fijos';
import { ORM_DCM_ENTITIES } from './documentos';
import { ORM_PDT_ENTITIES, ProductoOrm } from './productos';
import { ORM_CTC_ENTITIES } from './central-compras';

export const ORM_INN_ENTITIES = [
  ProductoOrm,
  ...ORM_PDT_ENTITIES,
  ...ORM_AFN_ENTITIES,
  ...ORM_DCM_ENTITIES,
  ...ORM_CTC_ENTITIES,
];
