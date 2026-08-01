import { DetalleMuestraCupsOrm } from './detalle-cups.orm';
import { FormatoMuestraAnatomopatologicaOrm } from './formato-anatomopatologicos.orm';

export * from './detalle-cups.orm';
export * from './formato-anatomopatologicos.orm';

export const FORMATO_MUESTRAS_ANATOMOPATOLOGICAS_ENTITIES = [
  FormatoMuestraAnatomopatologicaOrm,
  DetalleMuestraCupsOrm,
];
