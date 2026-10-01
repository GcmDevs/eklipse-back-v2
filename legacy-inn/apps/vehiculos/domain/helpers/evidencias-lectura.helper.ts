import { OrigenTanqueo, TipoEvidencia } from '../enums';
import { EstadoEvidencia } from '../enums/estados.enum';
import {
  mapEvidenceTypeFromPersistence,
  PERSISTED_DASHBOARD_EVIDENCE_TYPE_KEY,
} from './evidencias-tipo.helper';
import { EVIDENCIAS_LOTE_ESTACION } from '../policies/evidencias.policies';
import { EvidenciaTanqueoRead } from '../reads/tanqueo-read';
import { EvidenciaEntry } from '../types';

const LEGACY_FINAL_FUEL_INDICATOR_TYPE = 'INDICADOR_COMBUSTIBLE_DESPUES';

function hasFinalFuelIndicatorEvidence(entradas: EvidenciaEntry[]): boolean {
  return entradas.some(
    e =>
      e.tipo === TipoEvidencia.INDICADOR_COMBUSTIBLE_FINAL ||
      (e.tipo as string) === LEGACY_FINAL_FUEL_INDICATOR_TYPE
  );
}

function isLegacyStationBatchWithoutFinalIndicator(
  entradas: EvidenciaEntry[],
  origen: OrigenTanqueo
): boolean {
  if (origen !== OrigenTanqueo.ESTACION || hasFinalFuelIndicatorEvidence(entradas)) {
    return false;
  }
  const tipos = new Set(entradas.map(e => e.tipo as string));
  const hasDashboard =
    tipos.has(TipoEvidencia.TABLERO_INICIAL) || tipos.has(PERSISTED_DASHBOARD_EVIDENCE_TYPE_KEY);
  return (
    hasDashboard &&
    tipos.has(TipoEvidencia.SURTIDOR_INICIAL) &&
    tipos.has(TipoEvidencia.SURTIDOR_FINAL) &&
    tipos.has(TipoEvidencia.FACTURA)
  );
}

function sortByStationBatchEvidenceOrder(lista: EvidenciaTanqueoRead[]): EvidenciaTanqueoRead[] {
  const order = new Map(EVIDENCIAS_LOTE_ESTACION.map((t, i) => [t, i]));
  return [...lista].sort((a, b) => (order.get(a.tipo) ?? 99) - (order.get(b.tipo) ?? 99));
}

export function buildEvidenciasTanqueoRead(
  entradas: EvidenciaEntry[],
  origen: OrigenTanqueo
): EvidenciaTanqueoRead[] {
  const lista: EvidenciaTanqueoRead[] = entradas.map(e => ({
    tipo: mapEvidenceTypeFromPersistence(e.tipo as string),
    estado: e.estado,
    mediaId: e.mediaId,
    motivoOmision: e.motivoOmision,
    fecha: e.fecha,
  }));

  if (isLegacyStationBatchWithoutFinalIndicator(entradas, origen)) {
    lista.push({
      tipo: TipoEvidencia.INDICADOR_COMBUSTIBLE_FINAL,
      estado: EstadoEvidencia.NO_APLICA,
    });
    return sortByStationBatchEvidenceOrder(lista);
  }

  return lista;
}

export function toMinimalTanqueoEvidenceRead(value: EvidenciaTanqueoRead): EvidenciaTanqueoRead {
  if (value.estado === EstadoEvidencia.NO_APLICA) {
    return { tipo: value.tipo, estado: value.estado };
  }
  return value;
}
