import { Module } from '@nestjs/common';
import {
  FetchClasificacionImpl,
  FetchPartidosImpl,
  PronosticarPartidoImpl,
} from './infrastructure/services';
import { ClasificacionController, PartidosController } from './presentation/controllers';

@Module({
  controllers: [PartidosController, ClasificacionController],
  providers: [FetchPartidosImpl, PronosticarPartidoImpl, FetchClasificacionImpl],
})
export class PollaMundialistaModule {}
