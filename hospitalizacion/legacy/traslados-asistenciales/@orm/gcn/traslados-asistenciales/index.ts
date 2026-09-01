import { MedicamentoOrm } from './medicamento.orm';
import { TrasladoNotaOrm } from './nota.orm';
import { PacienteTrasladoOrm } from './paciente.orm';
import { ProcedimientoTempOrm } from './procedimiento-temp.orm';
import { ProcedimientoOrm } from './procedimiento.orm';
import { ProductoOrm } from './productos.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoEstadoHistorialOrm } from './traslado-estado-historial.orm';
import { TrasladoEvolucionOrm } from './traslado-evolucion.orm';
import { TrasladoRevisionCentralOrm } from './traslado-revision-central.orm';
import { TrasladoSignosVitalesOrm } from './traslado-signos-vitales.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { UbicacionOrm } from './ubicacion.orm';

export * from './traslado-asistencial.orm';
export * from './traslado-evolucion.orm';
export * from './traslado-tramo.orm';
export * from './traslado-asignacion.orm';
export * from './traslado-estado-historial.orm';
export * from './traslado-signos-vitales.orm';
export * from './traslado-revision-central.orm';
export * from './procedimiento.orm';
export * from './medicamento.orm';
export * from './nota.orm';
export * from './paciente.orm';
export * from './ubicacion.orm';
export * from './productos.orm';
export * from './procedimiento-temp.orm';

export const LGC_TAS_TRASLADO_ENTITIES = [
  TrasladoAsistencialOrm,
  TrasladoEvolucionOrm,
  TrasladoTramoOrm,
  TrasladoAsignacionOrm,
  TrasladoEstadoHistorialOrm,
  TrasladoSignosVitalesOrm,
  TrasladoRevisionCentralOrm,
  ProcedimientoOrm,
  MedicamentoOrm,
  TrasladoNotaOrm,
  PacienteTrasladoOrm,
  UbicacionOrm,
  ProductoOrm,
  ProcedimientoTempOrm,
];
