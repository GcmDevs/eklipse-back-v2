import {
  InnProveedorOrm,
  InnRolOrm,
  InnGenUsuarioOrm,
  InnDependenciaOrm,
  InnProductoOrm,
  InnDocumentoOrm,
  InnProductoOrdenCompraOrm,
} from './dim';
import { InnEklCentroOrm } from './ekl';

export const INVENTARIO_ENTITIES_OLDE = [
  InnDocumentoOrm,
  InnEklCentroOrm,
  InnProductoOrdenCompraOrm,
  InnProductoOrm,
  InnGenUsuarioOrm,
  InnRolOrm,
  InnDependenciaOrm,
  InnProveedorOrm,
];
