import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { SecurityModule } from '@gen/security/module';
import { ENTITIES } from './app.entities';
import {
  FILE_PATHS_ARR,
  FILE_PUBLIC_ROOT,
  FILE_REMOVED_ROOT,
  FILE_TEMP_ROOT,
} from './file-server.locations';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { FileSaverModule } from './file-server';

@Module({
  imports: [
    // --- AVOID NOWRAP --- //
    SecurityModule,
    FileSaverModule,
  ],
})
export class AppModule implements OnModuleInit {
  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);

    await Promise.all([
      fs.mkdir(FILE_TEMP_ROOT, { recursive: true }),
      ...FILE_PATHS_ARR.flatMap(folder => [
        fs.mkdir(resolve(FILE_PUBLIC_ROOT, folder), { recursive: true }),
        fs.mkdir(resolve(FILE_REMOVED_ROOT, folder), { recursive: true }),
      ]),
    ]);
  }
}
