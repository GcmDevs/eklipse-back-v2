import { FILE_LOCATIONS } from '@common/application/file-locations';
import { BadInputError } from '@common/domain/errors';
import { getCategoriaByMime } from '@core/media/application/factories/mime-categoria-factory';
import { StagingFileService } from '@core/media/application/services/staging.archivo.service';
import { DocumentoStorageStrategy } from '@core/media/application/strategies/documento.storage.strategy';
import { ImagenStorageStrategy } from '@core/media/application/strategies/imagen-storage.strategy';
import { ArchivoAlmacenado } from '@core/media/domain/entities/archivo-almacenado.entity';
import { CategoriaArchivo } from '@core/media/domain/enums/categorias-archivo.enum';
import { ArchivoAlmacenadoRead } from '@core/media/domain/read/media.read';
import { TipoContextoArchivo } from '@core/media/domain/types';
import { TipoDocCategoriaActivo } from '@equipos/domain/entities';
import { CategoriaDocumento } from '@equipos/domain/enums';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';

function archivoToRead(archivo: ArchivoAlmacenado): ArchivoAlmacenadoRead {
  return {
    id: archivo.getId.getValor,
    nombreOriginal: archivo.getNombreOriginal,
    extension: archivo.getExtension,
    tipoMime: archivo.getTipoMime.toString(),
    tamanoBytes: archivo.getTamanoBytes,
  };
}

export function resolveDocumentoStorage(categoriaDoc: string): {
  module: string;
  contexto: string;
} {
  if (categoriaDoc === CategoriaDocumento.MANUAL) {
    return {
      module: FILE_LOCATIONS.inn.eqp.catalogo.manuales,
      contexto: TipoContextoArchivo.DOCUMENTO_TIPO_EQUIPO_MANUAL,
    };
  } else if (categoriaDoc === CategoriaDocumento.TRANSACTIONAL_SUPPORT) {
    return {
      module: FILE_LOCATIONS.inn.eqp.catalogo.docsTx,
      contexto: TipoContextoArchivo.DOCUMENTO_TRANSACCIONAL_SOPORTE,
    };
  }
  return {
    module: FILE_LOCATIONS.inn.eqp.catalogo.docsAnex,
    contexto: TipoContextoArchivo.DOCUMENTO_TIPO_EQUIPO_SOPORTE,
  };
}

export function validateArchivoForCategoriaDocumento(
  archivo: ArchivoAlmacenado,
  categoriaDoc: string
): void {
  const mimeCategoria = getCategoriaByMime(archivo.getTipoMime);
  if (!mimeCategoria) {
    throw new BadInputError(`Formato no soportado: ${archivo.getTipoMime}`);
  }

  if (categoriaDoc === CategoriaDocumento.MANUAL) {
    const docStrategy = new DocumentoStorageStrategy();
    if (!docStrategy.validateFile(archivo)) {
      throw new BadInputError('Los manuales deben ser archivos PDF, Word o Excel');
    }
    return;
  }

  if (mimeCategoria === CategoriaArchivo.DOCUMENTO) {
    const docStrategy = new DocumentoStorageStrategy();
    if (!docStrategy.validateFile(archivo)) {
      throw new BadInputError('El soporte anexo debe ser PDF, Word, Excel o CSV');
    }
    return;
  }

  if (mimeCategoria === CategoriaArchivo.IMAGEN) {
    const imgStrategy = new ImagenStorageStrategy();
    if (!imgStrategy.validateFile(archivo)) {
      throw new BadInputError('El soporte anexo en imagen debe ser JPEG o PNG');
    }
    return;
  }

  throw new BadInputError(
    `Tipo de archivo no permitido para soporte anexo: ${archivo.getTipoMime}`
  );
}

export async function validateDocumentoInput(
  stagingFileService: StagingFileService,
  tipoDocumentoCategoria: string,
  aplica: boolean,
  tipoDocumentoEsObligatorio?: boolean,
  archivoId?: number
): Promise<void> {
  if (
    tipoDocumentoEsObligatorio !== undefined &&
    aplica &&
    tipoDocumentoEsObligatorio &&
    !archivoId
  ) {
    throw new BadInputError(
      'El documento es obligatorio y debe incluir un archivo cuando aplica=true'
    );
  }

  if (!aplica && archivoId) {
    throw new BadInputError('No debe enviar archivo cuando aplica=false');
  }

  if (aplica && archivoId) {
    const archivo = await stagingFileService.findById(archivoId, {
      throwIfNotFound: true,
    });

    validateArchivoForCategoriaDocumento(archivo, tipoDocumentoCategoria);
  }
}

export function assertTipoDocTransaccional(categoria: CategoriaDocumento): void {
  if (categoria !== CategoriaDocumento.TRANSACTIONAL_SUPPORT) {
    throw new BadInputError(
      'Para compras solo se permiten documentos de soporte transaccional (SOPORTE_TRANSACCIONAL)'
    );
  }
}

export function assertTipoDocAplica(tipoDoc: TipoDocCategoriaActivo, tipoActivoId: number): void {
  if (tipoDoc.getCategoria === CategoriaDocumento.TRANSACTIONAL_SUPPORT) {
    throw new BadInputError(
      `El tipo de documento "${tipoDoc.getNombre}" es de soporte transaccional y solo aplica a compras`
    );
  }
  if (!tipoDoc.AppliesToTipoActivo(tipoActivoId)) {
    throw new BadInputError(
      `El tipo de documento "${tipoDoc.getNombre}" no aplica para el tipo de activo del equipo`
    );
  }
}

export async function commitDocumentoTipoEquipoArchivo(
  stagingFileService: StagingFileService,
  categoriaDoc: string,
  archivoId: number,
  documentoId: number
): Promise<void> {
  const { module, contexto } = resolveDocumentoStorage(categoriaDoc);
  const categoriasPermitidas =
    categoriaDoc === CategoriaDocumento.MANUAL
      ? [CategoriaArchivo.DOCUMENTO]
      : [CategoriaArchivo.DOCUMENTO, CategoriaArchivo.IMAGEN];

  await stagingFileService.commit(
    {
      archivoId,
      module,
      contexto,
      referenciaId: documentoId,
    },
    { categorias: categoriasPermitidas },
    true
  );
}

export async function enrichDocumentosTipoEquipoRead(
  stagingFileService: StagingFileService,
  documentos: DocumentoTipoEquipoRead[]
): Promise<DocumentoTipoEquipoRead[]> {
  const ids = documentos.map(d => d.archivoId).filter((id): id is number => !!id);
  if (!ids.length) return documentos;

  const archivos = await stagingFileService.findByIds(ids);
  const byId = new Map(archivos.map(a => [a.getId.getValor, a]));

  return documentos.map(d => ({
    ...d,
    archivo:
      d.archivoId && byId.has(d.archivoId) ? archivoToRead(byId.get(d.archivoId)!) : undefined,
  }));
}
