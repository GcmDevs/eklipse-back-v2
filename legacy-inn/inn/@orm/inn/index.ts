import { ComprobanteEntradaOrm } from './documento/comprobante-entrada.orm';
import { DetalleComprobanteEntradaOrm } from './documento/comprobante-entrada.detalle.orm';
import { DocumentoOrm } from './documento/documento.orm';
import { DetalleOrdenCompraOrm } from './documento/orden-compra.detalle';
import { OrdenCompraOrm } from './documento/orden-compra';
import { DetalleRemisionEntradaOrm } from './documento/remision-entrada.detalle.orm';
import { RemisionEntradaOrm } from './documento/remision-entrada.orm';
import { AgrupamientoProductoOrm } from './producto/agrupamiento.orm';
import { AlmacenProductoOrm } from './producto/almacen.orm';
import { GrupoProductoOrm } from './producto/grupo.orm';
import { LoteProductoOrm } from './producto/lote.orm';
import { ProductoOrm } from './producto/producto.orm';
import { EstanteAlmacenOrm } from './producto/estante.orm';
import { ExistenciaProductoOrm } from './producto/existencia.orm';
import { ProductoEstanteOrm } from './producto/producto-estante.orm';
import { VerificacionEstanteOrm } from './producto/estante-verificacion.orm';
import { ProductoEstanteBasicOrm } from './producto/producto-estante-basic.orm';
import { DetalleSuministroPacienteOrm } from './suministros-paciente/detalle.orm';
import { SuministroPacienteOrm } from './suministros-paciente/suministros-paciente.orm';
import { AlmacenCentroOrm } from './producto/almacen-centro.orm';

export * from './documento/comprobante-entrada.detalle.orm';
export * from './documento/comprobante-entrada.orm';
export * from './documento/documento.orm';
export * from './documento/orden-compra.detalle';
export * from './documento/orden-compra';
export * from './documento/remision-entrada.detalle.orm';
export * from './documento/remision-entrada.orm';
export * from './producto/agrupamiento.orm';
export * from './producto/almacen.orm';
export * from './producto/grupo.orm';
export * from './producto/lote.orm';
export * from './producto/producto.orm';
export * from './producto/estante.orm';
export * from './producto/existencia.orm';
export * from './producto/producto-estante.orm';
export * from './producto/estante-verificacion.orm';
export * from './producto/producto-estante-basic.orm';
export * from './suministros-paciente/detalle.orm';
export * from './suministros-paciente/suministros-paciente.orm';
export * from './producto/almacen-centro.orm';

export const ORM_COMMON_INN_ENTITIES = [
  AlmacenCentroOrm,
  ComprobanteEntradaOrm,
  DetalleComprobanteEntradaOrm,
  DocumentoOrm,
  DetalleOrdenCompraOrm,
  OrdenCompraOrm,
  AgrupamientoProductoOrm,
  AlmacenProductoOrm,
  GrupoProductoOrm,
  LoteProductoOrm,
  ProductoOrm,
  EstanteAlmacenOrm,
  ExistenciaProductoOrm,
  ProductoEstanteOrm,
  ProductoEstanteBasicOrm,
  DetalleRemisionEntradaOrm,
  RemisionEntradaOrm,
  DetalleSuministroPacienteOrm,
  SuministroPacienteOrm,
  VerificacionEstanteOrm,
];
