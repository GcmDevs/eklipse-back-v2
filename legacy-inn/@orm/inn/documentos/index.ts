import { DocumentoOrm } from './documento.orm';
import { OrdenCompraOrm } from './orden-compra.orm';
import { OrdenDespachoOrm } from './orden-despacho.orm';
import { RemisionEntradaOrm } from './remision-entrada.orm';
import { SuministroPacienteOrm } from './suministro-paciente.orm';
import { ComprobanteEntradaOrm } from './comprobante-entrada.orm';
import { DetalleOrdenCompraOrm } from './orden-compra.detalle.orm';
import { DetalleOrdenDespachoOrm } from './orden-despacho.detalle.orm';
import { OrdenDespachoDocumentoOrm } from './orden-despacho.recordes.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada.detalle.orm';
import { DetalleComprobanteEntradaOrm } from './comprobante-entrada.detalle.orm';
import { DetalleSuministroPacienteOrm } from './suministro-paciente.detalle.orm';
import { DetalleOrdenActivoOrm } from './orden-compra.detalle-activo.orm';
import { TrasladoProductoOrm } from './traslado-producto.orm';
import { TrasladoProductoDetalleOrm } from './traslado-producto-detalle.orm';

export * from './documento.orm';
export * from './orden-compra.orm';
export * from './orden-despacho.orm';
export * from './remision-entrada.orm';
export * from './suministro-paciente.orm';
export * from './comprobante-entrada.orm';
export * from './orden-compra.detalle.orm';
export * from './orden-despacho.detalle.orm';
export * from './orden-despacho.recordes.orm';
export * from './remision-entrada.detalle.orm';
export * from './suministro-paciente.detalle.orm';
export * from './comprobante-entrada.detalle.orm';
export * from './orden-compra.detalle-activo.orm';
export * from './traslado-producto.orm';
export * from './traslado-producto-detalle.orm';

export const ORM_DCM_ENTITIES = [
  DetalleComprobanteEntradaOrm,
  DetalleSuministroPacienteOrm,
  OrdenDespachoDocumentoOrm,
  DetalleRemisionEntradaOrm,
  DetalleOrdenDespachoOrm,
  DetalleOrdenActivoOrm,
  DetalleOrdenCompraOrm,
  ComprobanteEntradaOrm,
  SuministroPacienteOrm,
  RemisionEntradaOrm,
  OrdenDespachoOrm,
  OrdenCompraOrm,
  DocumentoOrm,
  TrasladoProductoOrm,
  TrasladoProductoDetalleOrm,
];
