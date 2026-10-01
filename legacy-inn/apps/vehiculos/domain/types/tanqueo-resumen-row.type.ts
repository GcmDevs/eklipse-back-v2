import { EstadoTanqueo, OrigenTanqueo, TipoCombustible, UnidadMedidaCombustible } from '../enums';

export interface TanqueoResumenRow {
  activoId: number;
  tipoCombustible: TipoCombustible | null;
  valorTotalPagado: number | null;
  cantidadCombustible: number | null;
  unidadMedidaCombustible: UnidadMedidaCombustible | null;
  kilometrosRecorridos: number | null;
  rendimiento: number | null;
  fechaTanqueo: Date;
  estado: EstadoTanqueo;
  origen: OrigenTanqueo;
}
