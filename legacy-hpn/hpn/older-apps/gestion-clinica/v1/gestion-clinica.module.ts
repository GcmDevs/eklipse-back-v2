import { Module } from '@nestjs/common';
import {
  CreateEmpleadoOrEntidadService,
  CreateGestionService,
  DepartamentoByPatternService,
  EntidadByPatternService,
  MunicipioByPatternService,
  ServicioByPatternService,
  TrasladoCrudImpl,
  VehiculoByPatternService,
  motTrasladoByPatternService,
} from './infrastructure/services';
import {
  CreateEmpleadoOrEntidadController,
  CreateGestionController,
  FetchByPatternController,
  VehiculoCrudController,
} from './presentation/controllers';
import { EmpleadoByPatternService } from './infrastructure/services/empleado-by-pattern';

@Module({
  controllers: [
    FetchByPatternController,
    CreateGestionController,
    VehiculoCrudController,
    CreateEmpleadoOrEntidadController,
  ],
  providers: [
    EmpleadoByPatternService,
    DepartamentoByPatternService,
    motTrasladoByPatternService,
    MunicipioByPatternService,
    VehiculoByPatternService,
    CreateGestionService,
    EntidadByPatternService,
    TrasladoCrudImpl,
    ServicioByPatternService,
    CreateEmpleadoOrEntidadService,
  ],
})
export class GestionClinicaV1Module {}
