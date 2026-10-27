import type { IngresoReportes } from './consulta';

export const PROCESOS_REPORTES = ['pre-envio', 'concurrente', 'conciliacion'] as const;
export type ProcesoReportes = (typeof PROCESOS_REPORTES)[number];
export type TipoDocumentoReporte = 'historias-clinicas' | 'enfermeria' | 'prefactura' | 'factura';

export const DOCUMENTOS_POR_PROCESO: Record<ProcesoReportes, readonly TipoDocumentoReporte[]> = {
  'pre-envio': ['historias-clinicas', 'enfermeria', 'prefactura'],
  concurrente: ['historias-clinicas'],
  conciliacion: ['historias-clinicas', 'enfermeria', 'factura'],
};

export function ingresoElegibleParaProceso(
  ingreso: IngresoReportes,
  proceso: ProcesoReportes
): boolean {
  const estado = ingreso.estado?.trim().toLowerCase();
  if (proceso === 'pre-envio') return estado !== 'facturado';
  if (proceso === 'conciliacion') return estado === 'facturado';
  return ingreso.activo === true && !['facturado', 'cerrado', 'anulado'].includes(estado);
}

export function ingresoVisibleParaProceso(
  ingreso: IngresoReportes,
  proceso: ProcesoReportes
): boolean {
  return proceso === 'pre-envio' || ingresoElegibleParaProceso(ingreso, proceso);
}
