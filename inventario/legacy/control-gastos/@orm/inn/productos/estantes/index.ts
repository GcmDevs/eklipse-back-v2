import { EstanteOrm } from './estante.orm';
import { ProductoEstanteBasicOrm } from './producto-estante-basic.orm';
import { ReporteOrm } from './reporte.orm';
import { VerificacionOrm } from './verificacion.orm';

export * from './estante.orm';
export * from './producto-estante-basic.orm';
export * from './reporte.orm';
export * from './verificacion.orm';

export const LGC_CGT_INN_PRODUCTOS_ESTANTES_ENTITIES = [
  EstanteOrm,
  ProductoEstanteBasicOrm,
  ReporteOrm,
  VerificacionOrm,
];
