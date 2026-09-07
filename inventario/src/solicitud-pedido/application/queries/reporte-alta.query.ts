import { crearQueryReporteInventario } from './reporte-inventario.query';

const ALMACENES_ALTA = [155, 101, 105, 153, 106] as const;

export function getReporteAlta(): string {
  return crearQueryReporteInventario(ALMACENES_ALTA);
}
