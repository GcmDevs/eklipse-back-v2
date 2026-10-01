import { Module } from '@nestjs/common';
import { ConciliacionController, GestionController } from './presentation/controllers';
import { ConciliacionSource, GestionSource } from './infrastructure/repositories';
import { ConciliacionRepository, GestionRepository } from './domain/repositories';
import {
  ConciliacionHandler,
  FindTerceroByNitHandler,
  GestionHandler,
} from './presentation/handlers';

@Module({
  providers: [
    FindTerceroByNitHandler,
    ConciliacionHandler,
    GestionHandler,
    { provide: ConciliacionRepository, useClass: ConciliacionSource },
    { provide: GestionRepository, useClass: GestionSource },
  ],
  controllers: [GestionController, ConciliacionController],
})
export class CarteraModule {}
