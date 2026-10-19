import { ComprobanteEntradaOrm } from './comprobante-entrada/comprobante-entrada.orm';
import { DetalleComprobanteEntradaOrm } from './comprobante-entrada/detalle.orm';

import { RemisionEntradaOrm } from './remision-entrada/remision-entrada.orm';
import { DetalleRemisionEntradaOrm } from './remision-entrada/detalle.orm';

import { RecepcionTecnicaOrm } from './recepcion-tecnica/recepcion-tecnica.orm';
import { RTCSugerenciaOrm } from './recepcion-tecnica/sugerencia.orm';
import { RTCProductoOrm } from './recepcion-tecnica/producto.orm';
import { RTCLoteOrm } from './recepcion-tecnica/rtc-lote.orm';

import { SRDRCTSugerenciaOrm } from './shared-bd/rct-sugerencia.orm';
import { SRDCentroOrm } from './shared-bd/centro.orm';

import { DocumentoOrm } from './documento.orm';
import { ProveedorOrm } from './proveedor.orm';
import { UsuarioOrm } from './usuario.orm';
import { CentroOrm } from './centro.orm';

export * from './comprobante-entrada/comprobante-entrada.orm';
export * from './comprobante-entrada/detalle.orm';

export * from './remision-entrada/remision-entrada.orm';
export * from './remision-entrada/detalle.orm';

export * from './recepcion-tecnica/recepcion-tecnica.orm';
export * from './recepcion-tecnica/sugerencia.orm';
export * from './recepcion-tecnica/producto.orm';
export * from './recepcion-tecnica/rtc-lote.orm';

export * from './shared-bd/rct-sugerencia.orm';
export * from './shared-bd/centro.orm';

export * from './documento.orm';
export * from './proveedor.orm';
export * from './usuario.orm';
export * from './centro.orm';

export const ORM_INN_FARMACIA_ENTITIES = [
  ComprobanteEntradaOrm,
  DetalleComprobanteEntradaOrm,
  ProveedorOrm,
  SRDRCTSugerenciaOrm,
  SRDCentroOrm,
  RTCLoteOrm,
  RTCProductoOrm,
  RecepcionTecnicaOrm,
  RTCSugerenciaOrm,
  UsuarioOrm,
  CentroOrm,
  RemisionEntradaOrm,
  DetalleRemisionEntradaOrm,
  DocumentoOrm,
];
