import { Module } from '@nestjs/common';
import {
  ManageEntregaDietasImpl,
  ActualizarDietasImpl,
  FetchDietasByFechaImpl,
  CreateDietasBySubgrupoImpl,
  FetchPacientesBySubgrupoImpl,
  ConfigurarDietasExtraordinariasImpl,
  ItdBillingImpl,
} from './infrastructure/services';
import { TransactionDietaService } from './infrastructure/services/transaction';
import {
  ResourcesController,
  DietasController,
  ManageEntregaDietasController,
  DietasExtraordinariasController,
  DietasNoRecibidasController,
} from './presentation/controllers';
import {
  DietasCrudHandler,
  ConfDietaExtraHandler,
  FetchDietasByFechaHandler,
} from './presentation/handlers';

@Module({
  controllers: [
    ResourcesController,
    DietasController,
    ManageEntregaDietasController,
    DietasExtraordinariasController,
    DietasNoRecibidasController,
  ],
  providers: [
    ItdBillingImpl,
    ManageEntregaDietasImpl,
    DietasCrudHandler,
    ConfDietaExtraHandler,
    FetchDietasByFechaHandler,
    ActualizarDietasImpl,
    TransactionDietaService,
    FetchDietasByFechaImpl,
    CreateDietasBySubgrupoImpl,
    FetchPacientesBySubgrupoImpl,
    ConfigurarDietasExtraordinariasImpl,
  ],
})
export class DietasModule {}
