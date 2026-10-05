import { MimeTypes } from '@common/domain/enums';

export interface UploadArchivoOptions {
  nombreCampo: string;
  destino?: string;
  MimeTypesPermitidos: MimeTypes[];
  multiple: boolean;
  maxSizeMB?: number;
  maxCount?: number;
}
