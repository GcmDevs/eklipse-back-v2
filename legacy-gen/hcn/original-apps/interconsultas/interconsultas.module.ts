import { Module } from '@nestjs/common';
import { FetchInterconsultasPendientesService } from './application/services';
import { FetchInterconsultasPendientesApplication } from './infrastructure/services';
import { InterconsultasController } from './presentation/controllers';
import { FetchInterconsultasPendientesHandler } from './presentation/handlers';

@Module({
  controllers: [InterconsultasController],
  providers: [
    FetchInterconsultasPendientesHandler,
    {
      provide: FetchInterconsultasPendientesService,
      useClass: FetchInterconsultasPendientesApplication,
    },
  ],
})
export class InterconsultasModule {}
