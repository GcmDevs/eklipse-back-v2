import { AmbAmbulanciaOrm } from './amb-ambulancia.orm';
import { AmbDotacionNovedadOrm } from './amb-dotacion-novedad.orm';
import { AmbDotacionOrm } from './amb-dotacion.orm';
import { AmbElementoVencOrm } from './amb-elemento-venc.orm';
import { AmbEntregaDeclOrm } from './amb-entrega-decl.orm';
import { AmbEntregaOrm } from './amb-entrega.orm';
import { AmbEventoOrm } from './amb-evento.orm';
import { AmbLimpiezaOrm } from './amb-limpieza.orm';
import { AmbPlantillaOrm } from './amb-plantilla.orm';
import { AmbTurnoOrm } from './amb-turno.orm';

export * from './amb-ambulancia.orm';
export * from './amb-plantilla.orm';
export * from './amb-elemento-venc.orm';
export * from './amb-turno.orm';
export * from './amb-entrega.orm';
export * from './amb-entrega-decl.orm';
export * from './amb-limpieza.orm';
export * from './amb-dotacion.orm';
export * from './amb-dotacion-novedad.orm';
export * from './amb-evento.orm';

export const ORM_FLOTA_ENTITIES = [
  AmbAmbulanciaOrm,
  AmbPlantillaOrm,
  AmbElementoVencOrm,
  AmbTurnoOrm,
  AmbEntregaOrm,
  AmbEntregaDeclOrm,
  AmbLimpiezaOrm,
  AmbDotacionOrm,
  AmbDotacionNovedadOrm,
  AmbEventoOrm,
];
