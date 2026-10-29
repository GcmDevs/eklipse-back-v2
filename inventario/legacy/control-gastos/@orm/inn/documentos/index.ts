import { DetalleComprobanteEntradaOrm } from './comprobante-entrada.detalle.orm';
import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { DocumentoOrm } from './documento.orm';
import { DetalleOrdenDespachoOrm } from './orden-despacho.detalle.orm';
import { OrdenDespachoOrm } from './orden-despacho.orm';
import { OrdenDespachoDocumentoOrm } from './orden-despacho.recordes.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';
import { RemisionEntradaOrm } from './remision-entrada.orm';
import { TrasladoProductoDetalleOrm } from './traslado-producto-detalle.orm';
import { TrasladoProductoOrm } from './traslado-producto.orm';

export * from './comprobante-entrada.detalle.orm';
export * from './comprobante-entrada.orm';
export * from './documento.orm';
export * from './orden-despacho.detalle.orm';
export * from './orden-despacho.orm';
export * from './orden-despacho.recordes.orm';
export * from './remision-entrada.detalle.orm';
export * from './remision-entrada.orm';
export * from './traslado-producto-detalle.orm';
export * from './traslado-producto.orm';

export const LGC_CGT_INN_DOCUMENTOS_ENTITIES = [
  DetalleComprobanteEntradaOrm,
  ComprobanteEntradaOrm,
  DocumentoOrm,
  DetalleOrdenDespachoOrm,
  OrdenDespachoOrm,
  OrdenDespachoDocumentoOrm,
  DetalleRemisionEntradaOrm,
  RemisionEntradaOrm,
  TrasladoProductoDetalleOrm,
  TrasladoProductoOrm,
];
