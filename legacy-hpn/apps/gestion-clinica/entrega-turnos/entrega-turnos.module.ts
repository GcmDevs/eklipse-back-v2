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
import { HojasEspecialidadController } from './presentation/controllers/hojas-especialidad.controller';
import { HojasEspecialidadImpl } from './infrastructure/repositories/hojas-especialidad';

@Module({
  controllers: [
    HojasEspecialidadController,
    RecursosController,
    TurnoController,
    RegistroClinicoController,
    MedicoController,
    PreAltaController,
  ],
  providers: [
    HojasEspecialidadImpl,
    RecursosImpl,
    TurnoSource,
    RegistroClinicoImpl,
    MedicoImpl,
    CreatePrealtaImpl,
    TemporalesImpl,
  ],
})
export class EntregaTurnosModule {}
