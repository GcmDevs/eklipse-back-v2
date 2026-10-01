import { VerificacionOrm } from './verificacion.orm';
import { EstanteOrm } from './estante.orm';
import { ProductoEstanteBasicOrm } from './producto-estante-basic.orm';
import { ProductoEstanteOrm } from './producto-estante.orm';
import { ReporteOrm } from './reporte.orm';
import { CambioEstanteOrm } from './cambio-estante.orm';
export * from './reporte.orm';

export * from './verificacion.orm';
export * from './estante.orm';
export * from './producto-estante-basic.orm';
export * from './producto-estante.orm';
export * from './cambio-estante.orm';

export const ORM_PDT_STT_ENTITIES = [
  VerificacionOrm,
  EstanteOrm,
  ProductoEstanteBasicOrm,
  ProductoEstanteOrm,
  ReporteOrm,
  CambioEstanteOrm,
];
