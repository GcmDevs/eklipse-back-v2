import { ArchivoAlmacenado } from "@core/media/domain/entities";
import { DestinoArchivoConfig } from "@core/media/domain/types";

export interface StorageStrategy {
    getDestinationDir(destinoArchivoConfig: DestinoArchivoConfig, archivo: ArchivoAlmacenado): string;
    validateFile(file: ArchivoAlmacenado): boolean;
}
