import { TipoEvidencia } from '../enums';

export const PERSISTED_DASHBOARD_EVIDENCE_TYPE_KEY = 'TABLERO';

export function mapEvidenceTypeFromPersistence(tipo: string): TipoEvidencia {
  if (tipo === PERSISTED_DASHBOARD_EVIDENCE_TYPE_KEY) {
    return TipoEvidencia.TABLERO_INICIAL;
  }
  return tipo as TipoEvidencia;
}

export function mapEvidenceTypeToPersistence(tipo: TipoEvidencia): string {
  if (tipo === TipoEvidencia.TABLERO_INICIAL) {
    return PERSISTED_DASHBOARD_EVIDENCE_TYPE_KEY;
  }
  return tipo;
}
