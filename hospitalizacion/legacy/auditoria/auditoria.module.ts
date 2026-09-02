import { Module } from '@nestjs/common';
import {
  AuditoriaController,
  RecursosAuditoriaController,
  RecursosAuditoriaUnautenticatedController,
} from './presentation/controllers';
import {
  AuditoriaFetchIngresosUnautenticatedImpl,
  AuditoriaRecursosImpl,
  AuditoriaReporteImpl,
  CreateAuditoriaImpl,
  FetchAuditoriaImpl,
  UpdateAuditoriaImpl,
} from './infrastructure/repositories';
import { AuditoriaFetchIngresosImpl } from './infrastructure/repositories';
import { AuditoriaReporteOneByOneImpl } from './infrastructure/repositories/reporte-one-by-one.impl';

@Module({
  controllers: [
    AuditoriaController,
    RecursosAuditoriaController,
    RecursosAuditoriaUnautenticatedController,
  ],
  providers: [
    AuditoriaReporteOneByOneImpl,
    CreateAuditoriaImpl,
    UpdateAuditoriaImpl,
    FetchAuditoriaImpl,
    AuditoriaRecursosImpl,
    AuditoriaFetchIngresosImpl,
    AuditoriaFetchIngresosUnautenticatedImpl,
    AuditoriaReporteImpl,
  ],
})
export class LgcAudModule {}
