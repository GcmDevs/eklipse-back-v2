import { AuditoriaOrm } from './auditoria.orm';
import { EstanciaInactivaOrm } from './estancia-inactiva.orm';
import { EstudioDxOrm } from './estudio-dx.orm';
import { EventoSeguridadClinicaOrm } from './evento-seguridad-clinica.orm';
import { InternacionOrm } from './internacion.orm';
import { MedicamentoTrazadorOrm } from './medicamento-trazador.orm';
import { EkServicioIpsOrm } from './servicio-ips.orm';

export * from './auditoria.orm';
export * from './estancia-inactiva.orm';
export * from './estudio-dx.orm';
export * from './evento-seguridad-clinica.orm';
export * from './internacion.orm';
export * from './medicamento-trazador.orm';
export * from './servicio-ips.orm';

export const LGC_AUD_HPN_AUDITORIA_ENTITIES = [
  AuditoriaOrm,
  EstanciaInactivaOrm,
  EstudioDxOrm,
  EventoSeguridadClinicaOrm,
  InternacionOrm,
  MedicamentoTrazadorOrm,
  EkServicioIpsOrm,
];
