import { EstratoOrm } from './estrato.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm } from './paciente.orm';
import { TelefonoOrm } from './telefono.orm';
/* ------ */
import { GenSubgrupoOrm } from './gen-subgrupo.orm';
import { ServicioIpsOrm } from './servicio-ips.orm';
import { SolicitudExamenOrm } from './solicitud-examen.orm';
import { FolioOrm } from './folio.orm';
import { MedicoOrm } from './medico.orm';
import { SltMedicamentoOrm } from './solicitud-medicamento.orm';
import { MedicamentoOrm } from './medicamento.orm';
import { IndicacionesMedicasOrm } from './indicaciones-medicas.orm';

export * from './paciente.orm';
export * from './telefono.orm';
export * from './ingreso.orm';
export * from './estrato.orm';
/*-------- */

export * from './gen-subgrupo.orm';
export * from './servicio-ips.orm';
export * from './solicitud-examen.orm';
export * from './folio.orm';
export * from './medico.orm';
export * from './indicaciones-medicas.orm';

export const ORM_GEN_PACIENTE_ENTITIES = [
  PacienteOrm,
  TelefonoOrm,
  IngresoOrm,
  EstratoOrm,
  GenSubgrupoOrm,
  ServicioIpsOrm,
  SolicitudExamenOrm,
  FolioOrm,
  MedicoOrm,
  SltMedicamentoOrm,
  MedicamentoOrm,
  IndicacionesMedicasOrm,
];
