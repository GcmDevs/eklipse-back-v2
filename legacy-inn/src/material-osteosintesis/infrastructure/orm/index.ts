import { SetClasificacionOrm } from './shared/clasificacion.orm';
import { SetProductoOrm } from './shared/producto.orm';
import { SetLineaOrm } from './shared/linea.orm';
import { PacienteOrm } from './paciente.orm';
import { SetOrm } from './shared/set.orm';
import { OfertaDetalleOrm } from './terceros-am/oferta.detalle';
import { OfertaOrm } from './terceros-am/oferta';

export * from './shared/clasificacion.orm';
export * from './shared/producto.orm';
export * from './shared/producto.orm';
export * from './shared/linea.orm';
export * from './shared/set.orm';
export * from './paciente.orm';
export * from './terceros-am/oferta.detalle';
export * from './terceros-am/oferta';

export const ORM_INN_CBS_ENTITIES = [
  // --- AVOID NOWRAP --- //
  SetOrm,
  SetLineaOrm,
  SetClasificacionOrm,
  SetProductoOrm,
  PacienteOrm,
  OfertaDetalleOrm,
  OfertaOrm,
];
