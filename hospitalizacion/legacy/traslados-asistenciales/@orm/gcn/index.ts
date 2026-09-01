import { AsignacionVehiculoOrm } from './asignacion-vehiculo.orm';
import { DireccionOrm } from './direccion.orm';
import { EkEmpleadoOrm } from './ek-empleado.orm';
import { EmpleadoOrm } from './empleado.orm';
import { EntidadOrm } from './entidad.orm';
import { MotivoTrasladoOrm } from './mot-traslado.orm';
import { ServicioOrm } from './servicio-destino.orm';
import { TerceroOrm } from './tercero.orm';
import { LGC_TAS_TRASLADO_ENTITIES } from './traslados-asistenciales';
import { VehiculoOrm } from './vehiculo.orm';

export * from './asignacion-vehiculo.orm';
export * from './direccion.orm';
export * from './ek-empleado.orm';
export * from './empleado.orm';
export * from './entidad.orm';
export * from './mot-traslado.orm';
export * from './servicio-destino.orm';
export * from './tercero.orm';
export * from './traslados-asistenciales';
export * from './vehiculo.orm';

export const LGC_TAS_GCN_ENTITIES = [
  AsignacionVehiculoOrm,
  DireccionOrm,
  EkEmpleadoOrm,
  EmpleadoOrm,
  EntidadOrm,
  MotivoTrasladoOrm,
  ServicioOrm,
  TerceroOrm,
  VehiculoOrm,
  ...LGC_TAS_TRASLADO_ENTITIES,
];
