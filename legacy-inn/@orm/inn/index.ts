import { ORM_AFN_ENTITIES } from './activos-fijos';
import { ORM_AFN_SVT_ENTITIES } from './activos-fijos/servicio-tecnico';
import { ORM_PDT_STT_ENTITIES } from './productos/estantes';
import { ORM_DCM_ENTITIES } from './documentos';
import { ORM_PDT_ENTITIES, ProductoOrm } from './productos';
import { ORM_FMC_ENTITIES } from './farmacia/control-gastos';
import { ORM_RECTEC_ENTITIES } from './farmacia/recepcion-tecnica';
import { ORM_CTC_ENTITIES } from './central-compras';
import { ORM_INN_CONTEO_ENTITIES } from './inventario';
import { ORM_OFER_ENTITIES } from './ofertas';
import { ORM_SUM_PAC_ENTITIES } from './suministro-paciente';
import { ORM_EQPS_ENTITIES } from './equipos';
import { ORM_INN_VEHICULOS_ENTITIES } from '@vehiculos/infrastructure/persistence/orm';

export const ORM_INN_ENTITIES = [
  ProductoOrm,
  ...ORM_PDT_ENTITIES,
  ...ORM_AFN_ENTITIES,
  ...ORM_AFN_SVT_ENTITIES,
  ...ORM_PDT_STT_ENTITIES,
  ...ORM_DCM_ENTITIES,
  ...ORM_FMC_ENTITIES,
  ...ORM_RECTEC_ENTITIES,
  ...ORM_CTC_ENTITIES,
  ...ORM_INN_CONTEO_ENTITIES,
  ...ORM_OFER_ENTITIES,
  ...ORM_SUM_PAC_ENTITIES,
  ...ORM_EQPS_ENTITIES,
  ...ORM_INN_VEHICULOS_ENTITIES,
];
