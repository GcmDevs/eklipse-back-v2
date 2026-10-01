import { MimeTypes } from "@common/domain/enums";
import { BaseStorageStrategy } from "./base-storage.strategy";
import { ArchivoAlmacenado } from "@core/media/domain/entities";

export class DocumentoStorageStrategy extends BaseStorageStrategy {
    validateFile(archivo: ArchivoAlmacenado): boolean {
        const allowedMimes = [MimeTypes.PDF, MimeTypes.DOC, MimeTypes.DOCX, MimeTypes.XLS, MimeTypes.XLSX, MimeTypes.CSV];
        return allowedMimes.includes(archivo.getTipoMime as MimeTypes);
    }
}