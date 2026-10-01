import { ContratoOrm } from './contrato.orm';
import { DetalleContratoOrm } from './detalle-contrato.orm';
import { IpsOrm } from './ips.orm';
import { ProveedorOrm } from './proveedor.orm';
import { TerceroOrm } from './tercero.orm';

export * from './proveedor.orm';
export * from './tercero.orm';
export * from './contrato.orm';
export * from './detalle-contrato.orm';
export * from './ips.orm';

export const ORM_GEN_TERCERO_ENTITIES = [
  ProveedorOrm,
  TerceroOrm,
  ContratoOrm,
  DetalleContratoOrm,
  IpsOrm,
];
