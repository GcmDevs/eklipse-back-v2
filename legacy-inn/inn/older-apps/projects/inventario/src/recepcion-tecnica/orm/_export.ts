import { RecTecProductoOrm } from './recepcion-tecnica/producto.orm';
import { RecepcionTecnicaOrm } from './recepcion-tecnica/recepcion-tecnica.orm';
import { ProductoOrm } from './inventario/producto.orm';
import { UsuarioOrm } from './general/usuario.orm';
import { RolOrm } from './general/rol.orm';
import { CentroOSRD } from './shared-db/centro.orm';
import { SugerenciaOSRD } from './shared-db/sugerencia.orm';
import { RecTecLoteOrm } from './recepcion-tecnica/lote.orm';

export const ORM_INN_RECTEC_ENTITIES = [
  CentroOSRD,
  SugerenciaOSRD,
  ProductoOrm,
  RecTecProductoOrm,
  RecTecLoteOrm,
  RecepcionTecnicaOrm,
  RolOrm,
  UsuarioOrm,
];
