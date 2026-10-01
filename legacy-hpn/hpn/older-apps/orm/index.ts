import { CamaOrm } from './cama.orm';
import { DiagnosticoOrm } from './diagnostico.orm';
import { EgresoOrm } from './egreso.orm';
import { EstanciaOrm } from './estancia.orm';
import { GrupoOrm } from './grupo.orm';
import { HpnIngresoOrm } from './hpn-ingreso.orm';
import { HpnPacienteOrm } from './hpn-paciente.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { TipoCamaOrm } from './tipo-cama.orm';
import { SolicitudReferenciaOrm } from './solicitud-referencia.orm';

import { GestionOrm } from '@hpn/gestion-clinica/v1/infrastructure/orm/gestion.orm';

import { AsignacionVehiculoOrm } from '../gestion-clinica/v1/infrastructure/orm/asignacion-vehiculo.orm';
import { DireccionOrm } from '../gestion-clinica/v1/infrastructure/orm/direccion.orm';
import { EmpleadoOrm } from '../gestion-clinica/v1/infrastructure/orm/empleado.orm';
import { EntidadOrm } from '../gestion-clinica/v1/infrastructure/orm/entidad.orm';
import { IngresoOrm } from '../gestion-clinica/v1/infrastructure/orm/ingreso.orm';
import { MotivoTrasladoOrm } from '../gestion-clinica/v1/infrastructure/orm/mot-traslado.orm';
import { NotaOrm } from '../gestion-clinica/v1/infrastructure/orm/nota.orm';
import { ServicioOrm } from '../gestion-clinica/v1/infrastructure/orm/servicio-destino.orm';
import { SignoVitalOrm } from '../gestion-clinica/v1/infrastructure/orm/signo-vital.orm';
import { SolicitudTrasladoOrm } from '../gestion-clinica/v1/infrastructure/orm/solicitud-traslado.orm';
import { TerceroOrm } from '../gestion-clinica/v1/infrastructure/orm/tercero.orm';
import { VehiculoOrm } from '../gestion-clinica/v1/infrastructure/orm/vehiculo.orm';
import { EkEmpleadoOrm } from '../gestion-clinica/v1/infrastructure/orm/ek-empleado.orm';
import { GTCObservacionOrm } from '../gestion-clinica/v1/infrastructure/orm/observacion.orm';
import { CentroOrm } from './admisiones';

import { DepartamentoOrm, DireccionOrm as D2, MunicipioOrm, PaisOrm } from './general/ubicacion';
import {
  ContratoOrm,
  DetalleContratoOrm,
  IpsOrm,
  ProveedorOrm,
  TerceroOrm as T2,
} from './general/terceros';
import { ConsecutivoOrm, RolOrm, UsuarioOrm } from './general/seguridad';
import { DependenciaOrm } from './general/areas';
import { EstratoOrm, IngresoOrm as I2, PacienteOrm, TelefonoOrm } from './general/pacientes';
import {
  ConductaOrm,
  RecepcionTecnicaReactivosOrm,
  ValorCriticoOrm,
  ValoresCriticosReactivosOrm,
} from '@hpn/old/valores-criticos/infrastructure/orm';
import { CheckOrm } from '../gestion-clinica/pacientes/entities';
import { SalidaOrm } from '../estancias/entities/salidas.entity';
import { ReasignarOrm, UsuarioAreaOrm } from '../gestion-clinica/v2/entities';
import { BloqueoCamaOrm } from './bloquear-cama.orm';
import { MotivoBloqueoCamaOrm } from './motivo-bloqueo.orm';
import { PrealtaOrm } from './prealta.orm';
import { GestionSalidaOrm } from './gestion-salida.orm';

export * from './cama.orm';
export * from './diagnostico.orm';
export * from './estancia.orm';
export * from './grupo.orm';
export * from './subgrupo.orm';
export * from './tipo-cama.orm';
export * from './hpn-ingreso.orm';
export * from './hpn-paciente.orm';
export * from './egreso.orm';
export * from './solicitud-referencia.orm';

export const ORM_HPN_ENTITIES = [
  CamaOrm,
  DiagnosticoOrm,
  EstanciaOrm,
  GrupoOrm,
  SubgrupoOrm,
  TipoCamaOrm,
  HpnIngresoOrm,
  HpnPacienteOrm,
  EgresoOrm,
  CentroOrm,
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
  GestionOrm,
  SolicitudReferenciaOrm,
  RolOrm,
  UsuarioOrm,
  ConsecutivoOrm,
  MunicipioOrm,
  DepartamentoOrm,
  ProveedorOrm,
  T2,
  DependenciaOrm,
  I2,
  PacienteOrm,
  TelefonoOrm,
  EstratoOrm,
  D2,
  PaisOrm,
  ContratoOrm,
  DetalleContratoOrm,
  IpsOrm,
  CheckOrm,
  SalidaOrm,
  ValorCriticoOrm,
  ConductaOrm,
  ValoresCriticosReactivosOrm,
  RecepcionTecnicaReactivosOrm,
  BloqueoCamaOrm,
  MotivoBloqueoCamaOrm,
  PrealtaOrm,
  GestionSalidaOrm,
];
