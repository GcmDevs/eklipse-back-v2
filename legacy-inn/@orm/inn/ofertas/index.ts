import { EkinnoferCategoriaOrm } from './categoria.orm';
import { EkinnoferOfertaDocOrm } from './oferta-doc.orm';
import { EkinnoferOfertaOrm } from './ofertas.orm';
import { EkinnoferProductoOrm } from './producto.orm';
import { EkinnoferProveedorOrm } from './proveedor.orm';

export * from './categoria.orm';
export * from './producto.orm';
export * from './proveedor.orm';

export const ORM_OFER_ENTITIES = [
  EkinnoferCategoriaOrm,
  EkinnoferProductoOrm,
  EkinnoferProveedorOrm,
  EkinnoferOfertaOrm,
  EkinnoferOfertaDocOrm,
];
