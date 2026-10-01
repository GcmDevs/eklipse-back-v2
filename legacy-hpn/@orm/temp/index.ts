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
import { ServicioOrm } from './servicio.orm';
import { EspecialidadOrm } from './especialidad.orm';

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
export * from './servicio.orm';
export * from './especialidad.orm';

export const ORM_TEMP_ENTITIES = [
  ServicioOrm,
  CamaOrm,
  DiagnosticoOrm,
  EstanciaOrm,
  GrupoOrm,
  SubgrupoOrm,
  TipoCamaOrm,
  HpnIngresoOrm,
  HpnPacienteOrm,
  EgresoOrm,
  SolicitudReferenciaOrm,
  EspecialidadOrm,
];
