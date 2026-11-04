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
import { ConsultaPacientesDietasService } from './infrastructure/services/consulta-pacientes-dietas.service';
import { RegistrarDietasSubgrupoService } from './infrastructure/services/registrar-dietas-subgrupo.service';
import { SolicitarDietasAutomaticasService } from './infrastructure/services/solicitar-dietas-automaticas.service';
import { ProgramadorDietasService } from './infrastructure/services/programador-dietas.service';
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
    ConsultaPacientesDietasService,
    RegistrarDietasSubgrupoService,
    SolicitarDietasAutomaticasService,
    ProgramadorDietasService,
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
export class LgcDieModule {}
