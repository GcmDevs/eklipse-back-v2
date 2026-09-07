import { crearQueryReporteInventario } from './reporte-inventario.query';

const ALMACENES_CENTRO = [2, 39] as const;

export function getReporteCentro(): string {
  return crearQueryReporteInventario(ALMACENES_CENTRO);
}
