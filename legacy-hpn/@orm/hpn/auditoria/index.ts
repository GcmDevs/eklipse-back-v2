import { AuditoriaOrm } from './auditoria.orm';
import { EstudioDxOrm } from './estudio-dx.orm';
import { InternacionOrm } from './internacion.orm';
import { EstanciaInactivaOrm } from './estancia-inactiva.orm';
import { MedicamentoTrazadorOrm } from './medicamento-trazador.orm';
import { EventoSeguridadClinicaOrm } from './evento-seguridad-clinica.orm';
import { EkServicioIpsOrm } from './servicio-ips.orm';

export * from './evento-seguridad-clinica.orm';
export * from './medicamento-trazador.orm';
export * from './estancia-inactiva.orm';
export * from './internacion.orm';
export * from './estudio-dx.orm';
export * from './auditoria.orm';
export * from './servicio-ips.orm';

export const ORM_AUDITORIA_ENTITIES = [
  EventoSeguridadClinicaOrm,
  MedicamentoTrazadorOrm,
  EstanciaInactivaOrm,
  InternacionOrm,
  AuditoriaOrm,
  EstudioDxOrm,
  EkServicioIpsOrm,
];
