import { EstratoOrm } from './estrato.orm';
import { FolioOrm } from './folio.orm';
import { GenSubgrupoOrm } from './gen-subgrupo.orm';
import { IndicacionesMedicasOrm } from './indicaciones-medicas.orm';
import { IngresoOrm } from './ingreso.orm';
import { MedicamentoOrm } from './medicamento.orm';
import { MedicoOrm } from './medico.orm';
import { PacienteOrm } from './paciente.orm';
import { ServicioIpsOrm } from './servicio-ips.orm';
import { SltMedicamentoOrm } from './solicitud-medicamento.orm';
import { TelefonoOrm } from './telefono.orm';

export * from './estrato.orm';
export * from './folio.orm';
export * from './gen-subgrupo.orm';
export * from './indicaciones-medicas.orm';
export * from './ingreso.orm';
export * from './medicamento.orm';
export * from './medico.orm';
export * from './paciente.orm';
export * from './servicio-ips.orm';
export * from './solicitud-medicamento.orm';
export * from './telefono.orm';

export const LGC_TAS_GEN_PACIENTE_ENTITIES = [
  EstratoOrm,
  FolioOrm,
  GenSubgrupoOrm,
  IndicacionesMedicasOrm,
  IngresoOrm,
  MedicamentoOrm,
  MedicoOrm,
  PacienteOrm,
  ServicioIpsOrm,
  SltMedicamentoOrm,
  TelefonoOrm,
];
