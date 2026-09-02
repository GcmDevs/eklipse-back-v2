import { EstratoOrm } from './estrato.orm';
import { GenSubgrupoOrm } from './gen-subgrupo.orm';
import { IngresoOrm } from './ingreso.orm';
import { PacienteOrm } from './paciente.orm';
import { ServicioIpsOrm } from './servicio-ips.orm';
import { TelefonoOrm } from './telefono.orm';

export * from './estrato.orm';
export * from './gen-subgrupo.orm';
export * from './ingreso.orm';
export * from './paciente.orm';
export * from './servicio-ips.orm';
export * from './telefono.orm';

export const LGC_AUD_GEN_PACIENTE_ENTITIES = [
  EstratoOrm,
  GenSubgrupoOrm,
  IngresoOrm,
  PacienteOrm,
  ServicioIpsOrm,
  TelefonoOrm,
];
