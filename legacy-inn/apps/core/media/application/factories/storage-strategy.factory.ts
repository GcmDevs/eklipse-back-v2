import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DocumentoStorageStrategy,
  FlatStorageStrategy,
  ImagenStorageStrategy,
  StorageStrategy,
} from '../strategies';
import { CategoriaArchivo } from '@core/media/domain/enums';

@Injectable()
export class StorageStrategyFactory {
  getStrategy(categoriaArchivo: CategoriaArchivo): StorageStrategy {
    switch (categoriaArchivo) {
      case CategoriaArchivo.IMAGEN: {
        return new ImagenStorageStrategy();
      }
      case CategoriaArchivo.DOCUMENTO: {
        return new DocumentoStorageStrategy();
      }
      default: {
        throw new BadRequestException('No existe mime para ese tipo de archivo');
      }
    }
  }

  getFlatStrategy(): StorageStrategy {
    return new FlatStorageStrategy();
  }
}
