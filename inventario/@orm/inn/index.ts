import { ORM_INN_PRODUCTOS_ENTITIES, ProductoOrm } from './productos';
import { ORM_INN_DOCUMENTOS_ENTITIES } from './documentos';
import { ORM_INN_MAOS_ENTITIES } from './maos';
import { ORM_INN_CTMZ_ENTITIES } from './central-mezclas';
import { ORM_AFN_ENTITIES } from './activos-fijos';
import { ORM_INN_SOLICITUD_PEDIDO_ENTITIES } from './solicitud-pedido';
import { ORM_INN_PRODUCTS_ENTITIES } from './productos/inn';
import { ORM_INN_RONDAS_HABITACIONES_ENTITIES } from './rondas-habitaciones';
import { ORM_INN_INVIMA_ENTITIES } from './invima';
import { AlmacenOrm } from './almacen.orm';
import { ORM_EQPS_ENTITIES } from './activos/equipos';
import { ORM_FLOTA_ENTITIES } from './operaciones/turnos-vehiculos';
import { ORM_INN_VEHICULOS_ENTITIES } from '@inn/operaciones/tanqueos/infrastructure/persistence/orm';

export * from './almacen.orm';

export const ORM_INN_ENTITIES = [
  ProductoOrm,
  AlmacenOrm,
  ...ORM_INN_PRODUCTOS_ENTITIES,
  ...ORM_INN_DOCUMENTOS_ENTITIES,
  ...ORM_INN_MAOS_ENTITIES,
  ...ORM_INN_CTMZ_ENTITIES,
  ...ORM_AFN_ENTITIES,
  ...ORM_INN_SOLICITUD_PEDIDO_ENTITIES,
  ...ORM_INN_PRODUCTS_ENTITIES,
  ...ORM_INN_RONDAS_HABITACIONES_ENTITIES,
  ...ORM_INN_INVIMA_ENTITIES,
  ...ORM_EQPS_ENTITIES,
  ...ORM_INN_VEHICULOS_ENTITIES,
  ...ORM_FLOTA_ENTITIES,
];
