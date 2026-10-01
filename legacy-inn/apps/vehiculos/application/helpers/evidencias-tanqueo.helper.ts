import { FILE_LOCATIONS } from '@common/application/constants';

import { BadInputError } from '@common/domain/errors';

import { StagingFileService } from '@core/media/application/services/staging.archivo.service';

import {
  PayloadArchivo,
  RESTRICCIONES_MIME_STAGING,
  TipoContextoArchivo,
} from '@core/media/domain/types';

import { EvidenciaItem } from '../types';

export async function validateEvidenciasStaging(
  stagingFileService: StagingFileService,

  evidencias: EvidenciaItem[]
): Promise<void> {
  const mediaIds = evidencias.filter(e => !e.omitida && e.mediaId).map(e => e.mediaId as number);

  if (mediaIds.length === 0) return;

  const archivos = await stagingFileService.findByIds(mediaIds);

  if (archivos.length !== mediaIds.length) {
    const found = new Set(archivos.map(a => a.getId.getValor));

    const faltantes = mediaIds.filter(id => !found.has(id));

    throw new BadInputError(
      `Archivos de evidencia no encontrados: ${faltantes.join(', ')}. Vuelva a subirlos.`
    );
  }

  const usados = archivos.filter(a => a.getIsUsado);

  if (usados.length > 0) {
    throw new BadInputError(
      `Archivos de evidencia ya utilizados: ${usados.map(a => a.getId.getValor).join(', ')}`
    );
  }
}

export function buildEvidenciasTanqueoPayloads(
  evidencias: EvidenciaItem[],

  tanqueoId: number
): PayloadArchivo[] {
  if (!tanqueoId) {
    throw new BadInputError('No se puede confirmar evidencias sin id de tanqueo persistido');
  }

  return evidencias

    .filter(e => !e.omitida && e.mediaId)

    .map(e => ({
      archivoId: e.mediaId as number,

      contexto: TipoContextoArchivo.EVIDENCIA_TANQUEO,

      module: FILE_LOCATIONS.inn.veh.tanqueos.evidencias,

      referenciaId: tanqueoId,
    }));
}

export async function commitEvidenciasTanqueo(
  stagingFileService: StagingFileService,

  evidencias: EvidenciaItem[],

  tanqueoId: number
): Promise<void> {
  const payloads = buildEvidenciasTanqueoPayloads(evidencias, tanqueoId);

  if (payloads.length === 0) return;

  await stagingFileService.commitMany(payloads, RESTRICCIONES_MIME_STAGING.IMAGENES);
}

export async function commitEvidenciasTanqueoBatch(
  stagingFileService: StagingFileService,

  items: Array<{ evidencias: EvidenciaItem[]; tanqueoId: number }>
): Promise<void> {
  const payloads = items.flatMap(({ evidencias, tanqueoId }) =>
    buildEvidenciasTanqueoPayloads(evidencias, tanqueoId)
  );

  if (payloads.length === 0) return;

  await stagingFileService.commitMany(payloads, RESTRICCIONES_MIME_STAGING.IMAGENES);
}
