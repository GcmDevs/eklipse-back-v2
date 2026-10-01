import { MimeTypes } from "@common/domain/enums";
import { BaseStorageStrategy } from "./base-storage.strategy";
import { ArchivoAlmacenado } from "@core/media/domain/entities";

export class ImagenStorageStrategy extends BaseStorageStrategy {
    validateFile(archivo: ArchivoAlmacenado): boolean {
        const allowedMimes = [MimeTypes.PNG, MimeTypes.JPEG];
        return allowedMimes.includes(archivo.getTipoMime as MimeTypes);
    }
}