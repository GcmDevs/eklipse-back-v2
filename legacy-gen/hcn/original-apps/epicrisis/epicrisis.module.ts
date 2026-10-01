import { Module } from '@nestjs/common';
import { CambiarEstadoEpicrisisService } from './application/services';
import { CambiarEstadoEpicrisisApplication } from './infrastructure/services';
import { EpicrisisController } from './presentation/controllers';
import { CambiarEstadoEpicrisisHandler } from './presentation/handlers';

@Module({
  controllers: [EpicrisisController],
  providers: [
    CambiarEstadoEpicrisisHandler,
    {
      provide: CambiarEstadoEpicrisisService,
      useClass: CambiarEstadoEpicrisisApplication,
    },
  ],
})
export class EpicrisisModule {}
