import { AccesorioOrm } from './accesorio.orm';
import { ActivoFijoOrm } from './activo-fijo.orm';
import { AreaServicioOrm } from './area-servicio.orm';
import { EspecificacionCompOrm } from './especificacion-comp.orm';
import { DependenciaOrm } from './dependencia.orm';
import { DocumentoOrm } from './documento.orm';
import { GeneralActivoOrm } from './general-activo.orm';
import { GrupoOrm } from './grupo.orm';
import { MantenimientoOrm } from './mantenimiento.orm';
import { ProductoOrm } from './producto.orm';
import { ResponsableOrm } from './responsable.orm';
import { EspecificacionDispOrm } from './especificacion-disp.orm';
import { MtoAccesorioOrm } from './mto-accesorio.orm';

export * from './especificacion-comp.orm';
export * from './mantenimiento.orm';
export * from './accesorio.orm';
export * from './activo-fijo.orm';
export * from './general-activo.orm';
export * from './producto.orm';
export * from './area-servicio.orm';
export * from './grupo.orm';
export * from './responsable.orm';
export * from './dependencia.orm';
export * from './documento.orm';
export * from './especificacion-disp.orm';
export * from './mto-accesorio.orm';

export const ORM_INN_ACTIVOS_ENTITIES = [
  EspecificacionCompOrm,
  MantenimientoOrm,
  AccesorioOrm,
  ActivoFijoOrm,
  GeneralActivoOrm,
  ProductoOrm,
  AreaServicioOrm,
  GrupoOrm,
  ResponsableOrm,
  DependenciaOrm,
  DocumentoOrm,
  EspecificacionDispOrm,
  MtoAccesorioOrm,
];
