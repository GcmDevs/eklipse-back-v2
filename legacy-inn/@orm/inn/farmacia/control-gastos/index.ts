import { CentroOrm } from '@orm/adn';
import { LegalizacionFacturaHistorialOrm, LegalizacionFacturaOrm } from '../legalizacion-factura';
import { DetalleControlGastoOrm } from './control-gasto.detalle.orm';
import { ControlGastoOrm } from './control-gasto.orm';
import { ControlGastoHistorialOrm } from './historial-control-gasto.orm';

export * from './control-gasto.detalle.orm';
export * from './control-gasto.orm';
export * from './historial-control-gasto.orm';

export const ORM_FMC_ENTITIES = [
  ControlGastoOrm,
  DetalleControlGastoOrm,
  ControlGastoHistorialOrm,
  LegalizacionFacturaHistorialOrm,
  LegalizacionFacturaOrm,
  CentroOrm,
];
