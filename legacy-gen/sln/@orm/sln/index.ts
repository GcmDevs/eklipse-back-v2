import { ORM_CONTROL_EGRESOS } from './control-egresos';
import { DetalleHojaProductoOrm } from './hoja-producto-detalle.orm';
import { HojaProductoOrm } from './hoja-producto.orm';
import { HojaServicioOrm } from './hoja-servicio.orm';

export * from './hoja-producto-detalle.orm';
export * from './hoja-producto.orm';
export * from './hoja-servicio.orm';

export const SLN_ORM_ENTITIES = [
  ...ORM_CONTROL_EGRESOS,
  DetalleHojaProductoOrm,
  DetalleHojaProductoOrm,
  HojaProductoOrm,
  HojaServicioOrm,
];
