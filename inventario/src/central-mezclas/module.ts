import { Module } from '@nestjs/common';
import { RecursosController, SolicitudesController } from './presentation/controllers';
import { FetchSolicitudesImpl, CreateSolicitudImpl } from './infrastructure/services';

@Module({
  controllers: [RecursosController, SolicitudesController],
  providers: [FetchSolicitudesImpl, CreateSolicitudImpl],
})
export class CentralMezclasModule {}
