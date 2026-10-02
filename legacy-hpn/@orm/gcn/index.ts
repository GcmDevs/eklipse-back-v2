import { CheckOrm } from './check.orm';
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
import { ReasignarOrm } from './reasignar.orm';
import { UsuarioAreaOrm } from './usuario-area.orm';
import { GestionOrm } from './gestion.orm';
import {
  CambioTurnoOrm,
  EntregaTurnoOrm,
  ETPacienteTurnoOrm,
  ETPreAltaOrm,
  ETRegistroClinicoOrm,
  PacienteEvolucionOrm,
  PacienteTemporalOrm,
} from './entrega-turno';
import {
  MedicamentoOrm,
  PacienteTrasladoOrm,
  ProcedimientoOrm,
  ProcedimientoTempOrm,
  ProductoOrm,
  TrasladoAsignacionOrm,
  TrasladoAsistencialOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoEvolucionOrm,
  TrasladoNotaOrm,
  TrasladoRevisionCentralOrm,
  TrasladoSignosVitalesOrm,
  TrasladoTramoOrm,
  UbicacionOrm as TrasladoUbicacionOrm,
} from './traslados-asistenciales';
import { ORM_GCN_BOLETA_QUIRURGICA_ENTITIES } from './boleta-quirurgica';

export * from './check.orm';
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
export * from './reasignar.orm';
export * from './usuario-area.orm';
export * from './gestion.orm';
export * from './entrega-turno/entrega-turno.orm';
export * from './entrega-turno/paciente-turno.orm';
export * from './entrega-turno/registro-clinico.orm';
export * from './entrega-turno/paciente-evolucion.orm';
export * from './entrega-turno/cambio-turno.orm';
export * from './entrega-turno/paciente-temporal.orm';
export * from './traslados-asistenciales/traslado-asistencial.orm';
export * from './traslados-asistenciales/traslado-evolucion.orm';
export * from './traslados-asistenciales/traslado-tramo.orm';
export * from './traslados-asistenciales/traslado-asignacion.orm';
export * from './traslados-asistenciales/traslado-estado-historial.orm';
export * from './traslados-asistenciales/traslado-signos-vitales.orm';
export * from './traslados-asistenciales/traslado-revision-central.orm';
export * from './traslados-asistenciales/nota.orm';
export * from './traslados-asistenciales/procedimiento.orm';
export * from './traslados-asistenciales/medicamento.orm';
export * from './traslados-asistenciales/paciente.orm';
export * from './traslados-asistenciales/ubicacion.orm';
export * from './boleta-quirurgica';
export * from './traslados-asistenciales/procedimiento-temp.orm';

export const ORM_GEN_GESTION_CLINICA_ENTITIES = [
  GestionOrm,
  CheckOrm,
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
  EntregaTurnoOrm,
  ETPacienteTurnoOrm,
  ETRegistroClinicoOrm,
  PacienteEvolucionOrm,
  PacienteTemporalOrm,
  CambioTurnoOrm,
  ETPreAltaOrm,
  TrasladoAsistencialOrm,
  TrasladoEvolucionOrm,
  TrasladoTramoOrm,
  TrasladoAsignacionOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoSignosVitalesOrm,
  TrasladoNotaOrm,
  ProcedimientoOrm,
  MedicamentoOrm,
  TrasladoRevisionCentralOrm,
  PacienteTrasladoOrm,
  TrasladoUbicacionOrm,
  ProductoOrm,
  ...ORM_GCN_BOLETA_QUIRURGICA_ENTITIES,
  ProcedimientoTempOrm,
];
