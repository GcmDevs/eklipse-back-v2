import { ReasignarOrm, UsuarioAreaOrm } from 'hpn/older-apps/gestion-clinica/v2/entities';
import { AsignacionVehiculoOrm } from './asignacion-vehiculo.orm';
import { DireccionOrm } from './direccion.orm';
import { EmpleadoOrm } from './empleado.orm';
import { EntidadOrm } from './entidad.orm';
import { IngresoOrm } from './ingreso.orm';
import { MotivoTrasladoOrm } from './mot-traslado.orm';
import { NotaOrm } from './nota.orm';
import { ServicioOrm } from './servicio-destino.orm';
import { SignoVitalOrm } from './signo-vital.orm';
import { SolicitudTrasladoOrm } from './solicitud-traslado.orm';
import { TerceroOrm } from './tercero.orm';
import { VehiculoOrm } from './vehiculo.orm';
import { EkEmpleadoOrm } from './ek-empleado.orm';
import { GTCObservacionOrm } from './observacion.orm';

export * from './solicitud-traslado.orm';
export * from './entidad.orm';
export * from './direccion.orm';
export * from './tercero.orm';
export * from './mot-traslado.orm';
export * from './empleado.orm';
export * from './asignacion-vehiculo.orm';
export * from './vehiculo.orm';
export * from './ingreso.orm';
export * from './nota.orm';
export * from './servicio-destino.orm';
export * from './signo-vital.orm';
export * from './ek-empleado.orm';
export * from './observacion.orm';

export const ORM_HPN_GCM_ENTITIES = [
  GTCObservacionOrm,
  SolicitudTrasladoOrm,
  ReasignarOrm,
  UsuarioAreaOrm,
  EntidadOrm,
  DireccionOrm,
  TerceroOrm,
  MotivoTrasladoOrm,
  EmpleadoOrm,
  AsignacionVehiculoOrm,
  VehiculoOrm,
  IngresoOrm,
  NotaOrm,
  ServicioOrm,
  SignoVitalOrm,
  EkEmpleadoOrm,
];
