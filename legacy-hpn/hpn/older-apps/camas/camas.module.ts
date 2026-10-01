import { Module } from '@nestjs/common';
import { CamasController } from './presentation/controllers';
import {
  FetchCamasDisponiblesHandler,
  EstadisticasCamasDisponiblesHandler,
  CamaOcupadaHandler,
  MarcarPrealtaHandler,
  LaboratorioHandler,
  MedicamentosHandler,
  ListaEsperaCamaHandler,
  ListaEsperaCamaReferenciaHandler,
  EvoluionesHandler,
} from './presentation/handlers';
import {
  CamaSourceRepository,
  EstadisticasCamaSourceRepository,
  CamaOcupadaSourceRepository,
  MedicamentosSourceRepository,
  ProcedimientosSourceRepository,
  ListaEsperaCamaSourceRepository,
  ListaEsperaCamaReferenciaSourceRepository,
  EvolucionesSourceRepository,
  EstanciasSourceRepository,
} from './insfrastructure/repositories';
import { BloquearCamaHandler } from './presentation/handlers/bloquear-cama.handler';
import { BloquearCamaSourceRepository } from './insfrastructure/repositories/bloquear-cama.source';
import { MarcarPrealtaSourceRepository } from './insfrastructure/repositories/marcar-prealta.source';
import { LaboratorioSourceRepository } from './insfrastructure/repositories/laboratorio.source';
import { ProcedimientosHandler } from './presentation/handlers/procedimientos.handler';
import { ListaReservaHandler } from './presentation/handlers/lista-reserva.handler';
import { ListaReservaSourceRepository } from './insfrastructure/repositories/lista-reserva.source';
import { EstanciasHandler } from './presentation/handlers/estancias.handler';

@Module({
  controllers: [CamasController],
  providers: [
    FetchCamasDisponiblesHandler,
    CamaSourceRepository,
    //estadisticas
    EstadisticasCamasDisponiblesHandler,
    EstadisticasCamaSourceRepository,
    //bloquear cama
    BloquearCamaHandler,
    BloquearCamaSourceRepository,
    //marcar prealta
    MarcarPrealtaHandler,
    MarcarPrealtaSourceRepository,
    //cama ocupada
    CamaOcupadaHandler,
    CamaOcupadaSourceRepository,
    //laboratorio
    LaboratorioHandler,
    LaboratorioSourceRepository,
    //medicamentos
    MedicamentosHandler,
    MedicamentosSourceRepository,
    //procedimientos
    ProcedimientosHandler,
    ProcedimientosSourceRepository,
    //lista espera camas
    ListaEsperaCamaHandler,
    ListaEsperaCamaSourceRepository,
    //lista espera camas
    ListaEsperaCamaReferenciaHandler,
    ListaEsperaCamaReferenciaSourceRepository,
    //lista reserva camas
    ListaReservaHandler,
    ListaReservaSourceRepository,
    //evoluciones
    EvoluionesHandler,
    EvolucionesSourceRepository,
    //estancias
    EstanciasSourceRepository,
    EstanciasHandler,
  ],
})
export class CamasModule {}
