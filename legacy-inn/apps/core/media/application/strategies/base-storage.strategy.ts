import { STORAGE_BASE } from '@common/application/file-locations';
import { ArchivoAlmacenado } from '@core/media/domain/entities';
import { DestinoArchivoConfig } from '@core/media/domain/types';

export abstract class BaseStorageStrategy {
  protected readonly BaseStorageLocation = STORAGE_BASE;

  getDestinationDir(
    destinoArchivoConfig: DestinoArchivoConfig,
    archivo: ArchivoAlmacenado
  ): string {
    const { module, category } = destinoArchivoConfig;
    const finalPath = `${this.BaseStorageLocation}/${module}/${category}`;
    return finalPath;
  }
  abstract validateFile(archivo: ArchivoAlmacenado): boolean;
}
