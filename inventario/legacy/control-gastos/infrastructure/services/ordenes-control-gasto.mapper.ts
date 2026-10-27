import { ControlGastoOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/control-gasto.orm';

export function mapOrdenesControlGasto(gasto: ControlGastoOrm) {
  const archivos = (gasto.archivos || [])
    .filter(archivo => [1, 2].includes(archivo.tipoCode))
    .sort((a, b) => a.id - b.id);
  const ordenes = archivos.map(archivo => ({
    id: archivo.id as number | null,
    documentoId: archivo.documentoId,
    tipoCode: archivo.tipoCode === 1 ? 0 : 19,
    consecutivo: archivo.documento?.consecutivo ?? String(archivo.documentoId),
    updatedAt: archivo.updatedAt ?? null,
    rechazadoAt: archivo.rechazadoAt ?? null,
    motivoRechazo: archivo.motivoRechazo ?? null,
    esAnterior: false,
  }));
  const anterior = gasto.ordenRelacionada;
  if (
    anterior &&
    [0, 19].includes(anterior.tipoCode) &&
    !archivos.some(a => a.documentoId === anterior.id)
  ) {
    ordenes.unshift({
      id: null,
      documentoId: anterior.id,
      tipoCode: anterior.tipoCode,
      consecutivo: anterior.consecutivo,
      updatedAt: null,
      rechazadoAt: null,
      motivoRechazo: null,
      esAnterior: true,
    });
  }
  return ordenes;
}
