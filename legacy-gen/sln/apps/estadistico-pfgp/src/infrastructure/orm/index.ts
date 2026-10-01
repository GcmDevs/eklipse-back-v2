import { AgrupadorServicioIpsBasicOrm } from './agrupador-servicio-basic.orm';
import { AgrupadorCheckPointContratoOrm } from './check-point-agrupador.orm';
import { AgrupadorServicioIpsOrm } from './agrupador-servicio.orm';
import { DetalleContratoOrm } from './contrato-detalle.orm';
import { CheckPointContratoOrm } from './check-point.orm';
import { ServicioIpsOrm } from './servicio.orm';
import { AgrupadorOrm } from './agrupador.orm';
import { ContratoOrm } from './contrato.orm';
import { FacturaOrm } from './factura.orm';
import { TerceroOrm } from './tercero.orm';

export * from './agrupador-servicio-basic.orm';
export * from './check-point-agrupador.orm';
export * from './agrupador-servicio.orm';
export * from './contrato-detalle.orm';
export * from './check-point.orm';
export * from './agrupador.orm';
export * from './contrato.orm';
export * from './servicio.orm';
export * from './tercero.orm';
export * from './factura.orm';

export const ORM_INFO_GEREN_ENTITIES = [
  AgrupadorOrm,
  AgrupadorServicioIpsOrm,
  CheckPointContratoOrm,
  ContratoOrm,
  ServicioIpsOrm,
  TerceroOrm,
  FacturaOrm,
  DetalleContratoOrm,
  AgrupadorCheckPointContratoOrm,
  AgrupadorServicioIpsBasicOrm,
];
