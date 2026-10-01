import { ItemCotizadoOrm } from './item-cotizado.orm';
import { ProductoSetOrm } from './producto-set.orm';
import { SetOrm } from './set.orm';
import { ValorItemCotizadoOrm } from './valor-item-cotizado.orm';
import { DetalleCotizacionOrm } from './detalle-cotizacion.orm';
import { DetalleSolicitudOrm } from './detalle-solicitud.orm';
import { DetalleCuentaxPagarOrm } from './cuenta-pagar.orm';
import { DocumentoCotizacionOrm } from './documento.orm';
import { CambioEstadoOrm } from './cambio-estado.orm';
import { CotizacionOrm } from './cotizacion.orm';
import { SolicitudOrm } from './solicitud.orm';
import { PagoOrm } from './pago.orm';
import { CotizacionPrefabricadaItemOrm } from './cotizacion-prefabricada-item.orm';
import { CotizacionPrefabricadaOrm } from './cotizacion-prefabricada.orm';

export * from './set.orm';
export * from './item-cotizado.orm';
export * from './valor-item-cotizado.orm';
export * from './producto-set.orm';
export * from './detalle-cotizacion.orm';
export * from './detalle-solicitud.orm';
export * from './cambio-estado.orm';
export * from './cuenta-pagar.orm';
export * from './cotizacion.orm';
export * from './solicitud.orm';
export * from './documento.orm';
export * from './pago.orm';
export * from './cotizacion-prefabricada-item.orm';
export * from './cotizacion-prefabricada.orm';

export const ORM_CTC_ENTITIES = [
  SetOrm,
  ItemCotizadoOrm,
  ValorItemCotizadoOrm,
  ProductoSetOrm,
  DetalleCuentaxPagarOrm,
  DocumentoCotizacionOrm,
  DetalleCotizacionOrm,
  DetalleSolicitudOrm,
  CambioEstadoOrm,
  CotizacionOrm,
  SolicitudOrm,
  PagoOrm,
  CotizacionPrefabricadaOrm,
  CotizacionPrefabricadaItemOrm,
];
