import { mapEvidenceTypeFromPersistence } from '@vehiculos/domain/helpers/evidencias-tipo.helper';
import { EvidenciaEntry } from '@vehiculos/domain/types';
import { EvidenciasTanqueo } from '@vehiculos/domain/value-objects';
import { ValueTransformer } from 'typeorm';

type EvidenciasRaw = Record<string, Omit<EvidenciaEntry, 'tipo'>>;

function fromRaw(crudo: EvidenciasRaw): EvidenciasTanqueo {
  const entradas: EvidenciaEntry[] = Object.entries(crudo).map(([tipo, e]) => ({
    tipo: mapEvidenceTypeFromPersistence(tipo),
    estado: e.estado,
    mediaId: e.mediaId,
    motivoOmision: e.motivoOmision,
    fecha: new Date(e.fecha),
  }));
  return EvidenciasTanqueo.fromEntradas(entradas);
}

export const evidenciasTanqueoTransformer: ValueTransformer = {
  to: (valor?: EvidenciasTanqueo): string => {
    if (!valor) return '{}';
    return JSON.stringify(valor.toJSON());
  },
  from: (valor?: string | EvidenciasTanqueo | EvidenciasRaw): EvidenciasTanqueo => {
    if (!valor) return EvidenciasTanqueo.empty();
    if (valor instanceof EvidenciasTanqueo) return valor;
    if (typeof valor === 'object') return fromRaw(valor);
    return fromRaw(JSON.parse(valor) as EvidenciasRaw);
  },
};
