import { MimeTypes } from '@common/domain/enums';
import { CategoriaArchivo } from '../../domain/enums/categorias-archivo.enum';

const MimeToCategory: Record<MimeTypes, CategoriaArchivo> = {
  [MimeTypes.JPEG]: CategoriaArchivo.IMAGEN,
  [MimeTypes.PNG]: CategoriaArchivo.IMAGEN,
  [MimeTypes.CSV]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.PDF]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.DOC]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.DOCX]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.XLS]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.XLSX]: CategoriaArchivo.DOCUMENTO,
  [MimeTypes.MP4]: CategoriaArchivo.VIDEO,
};

export function getCategoriaByMime(mime: MimeTypes): CategoriaArchivo | null {
  return MimeToCategory[mime] ?? null;
}
