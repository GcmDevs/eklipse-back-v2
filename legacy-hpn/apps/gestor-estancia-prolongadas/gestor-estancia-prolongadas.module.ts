import { Module } from '@nestjs/common';
import {
  GestorEstanciaProlongadasController,
  NotificacionesController,
} from './presentation/controllers';
import {
  GestorEstanciaProlongadasImpl,
  NotificacionesService,
} from './infraestructure/repositories';
import { DominioModule } from './domains.module';
import { StaysModule } from './stays.module';

@Module({
  imports: [DominioModule, StaysModule],
  controllers: [GestorEstanciaProlongadasController, NotificacionesController],
  providers: [GestorEstanciaProlongadasImpl, NotificacionesService],
})
export class GestorEstanciaProlongadasModule {}
