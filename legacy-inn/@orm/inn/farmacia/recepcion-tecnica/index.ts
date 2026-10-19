import { DetalleRecepcionTecnicaOrm } from './recepcion-tecnica.detalle.orm';
import { RecepcionTecnicaOrm } from './recepcion-tecnica.orm';
import { RTCLoteOrm } from './lote.orm';
import { RTCSugerenciaOrm } from './sugerencia.orm';

export * from './recepcion-tecnica.detalle.orm';
export * from './recepcion-tecnica.orm';
export * from './lote.orm';
export * from './sugerencia.orm';

export const ORM_RECTEC_ENTITIES = [
  DetalleRecepcionTecnicaOrm,
  RecepcionTecnicaOrm,
  RTCLoteOrm,
  RTCSugerenciaOrm,
];
