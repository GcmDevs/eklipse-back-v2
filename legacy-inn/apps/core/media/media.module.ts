import { Global, Module } from '@nestjs/common';
import { StorageStrategyFactory } from './application/factories/storage-strategy.factory';
import { AnexoReader } from './application/services/anexo-reader.service';
import { AnexoWriter } from './application/services/anexos-writer.service';
import { StagingFileService } from './application/services/staging.archivo.service';
import { ANEXO_REPOSITORY, ARCHIVO_ALMDO_REPOSITORY } from './domain/repositories';
import {
  TypeOrmAnexoRepository,
  TypeOrmArchivoAlmdoRepository,
} from './infrastructure/persistence';
import { MediaController } from './presentation/controllers/media.controller';

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    StagingFileService,
    StorageStrategyFactory,
    AnexoWriter,
    AnexoReader,
    {
      provide: ARCHIVO_ALMDO_REPOSITORY,
      useClass: TypeOrmArchivoAlmdoRepository,
    },
    {
      provide: ANEXO_REPOSITORY,
      useClass: TypeOrmAnexoRepository,
    },
  ],
  exports: [StagingFileService, AnexoWriter, AnexoReader],
})
export class MediaModule {}
