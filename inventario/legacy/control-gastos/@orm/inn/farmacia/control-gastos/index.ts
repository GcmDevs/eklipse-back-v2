import { DetalleControlGastoOrm } from './control-gasto.detalle.orm';
import { ControlGastoOrm } from './control-gasto.orm';
import { ControlGastoHistorialOrm } from './historial-control-gasto.orm';

export * from './control-gasto.detalle.orm';
export * from './control-gasto.orm';
export * from './historial-control-gasto.orm';

export const LGC_CGT_INN_FARMACIA_CONTROL_GASTOS_ENTITIES = [
  DetalleControlGastoOrm,
  ControlGastoOrm,
  ControlGastoHistorialOrm,
];
