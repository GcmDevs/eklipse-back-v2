import { DevolucionSumPacOrm } from './devolucion-suministro.orm';
import { DetalleDevSumOrm } from './reserva-suministro.orm';

export * from './devolucion-suministro.orm';
export * from './reserva-suministro.orm';

export const ORM_INN_DOCS_SUMPAC_DEV_TRAD_ENTITIES = [DevolucionSumPacOrm, DetalleDevSumOrm];
