import { Module } from '@nestjs/common';
import {
  MedicoController,
  PreAltaController,
  RecursosController,
  TurnoController,
} from './presentation/controllers';
import {
  TurnoSource,
  RecursosImpl,
  RegistroClinicoImpl,
  MedicoImpl,
  CreatePrealtaImpl,
  TemporalesImpl,
} from './infrastructure/repositories';
import { RegistroClinicoController } from './presentation/controllers/registro-clinico.controller';

@Module({
  controllers: [
    RecursosController,
    TurnoController,
    RegistroClinicoController,
    MedicoController,
    PreAltaController,
  ],
  providers: [
    RecursosImpl,
    TurnoSource,
    RegistroClinicoImpl,
    MedicoImpl,
    CreatePrealtaImpl,
    TemporalesImpl,
  ],
})
export class EntregaTurnosModule {}
