import { ContratoOrm } from './contrato.orm';
import { DetalleContratoOrm } from './detalle.orm';

export * from './detalle.orm';
export * from './contrato.orm';

export const ORM_GEN_CONTRATOS_ENTITIES = [
  // --- AVOID NOWRAP --- //
  DetalleContratoOrm,
  ContratoOrm,
];
