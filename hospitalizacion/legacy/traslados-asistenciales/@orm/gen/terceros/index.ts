import { ContratoOrm } from './contrato.orm';
import { DetalleContratoOrm } from './detalle-contrato.orm';

export * from './contrato.orm';
export * from './detalle-contrato.orm';

export const LGC_TAS_GEN_TERCERO_ENTITIES = [ContratoOrm, DetalleContratoOrm];
