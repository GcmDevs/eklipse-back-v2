import { EntidadTipoAnexo, MimeTypes } from '@common/domain/enums';

export interface ArchivoAlmacenadoRead {
  id: number;
  nombreOriginal: string;
  extension: string;
  tipoMime: string;
  tamanoBytes: number;
}

export interface AnexoRead {
  id: number;
  nombre: string | null;
  archivo: ArchivoAlmacenadoRead;
  orden: number;
  observaciones?: string;
}
