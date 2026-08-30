import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { DetalleComprobanteEntradaOrm } from './comprobante-entrada.detalle.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';
import { DocumentoOrm } from './documento.orm';
import { RemisionEntradaOrm } from './remision-entrada.orm';

export * from './comprobante-entrada.orm';
export * from './comprobante-entrada.detalle.orm';
export * from './remision-entrada.detalle.orm';
export * from './documento.orm';
export * from './remision-entrada.orm';

export const LGC_RCT_DOCUMENTO_ENTITIES = [
  ComprobanteEntradaOrm,
  DetalleComprobanteEntradaOrm,
  DetalleRemisionEntradaOrm,
  DocumentoOrm,
  RemisionEntradaOrm,
];
