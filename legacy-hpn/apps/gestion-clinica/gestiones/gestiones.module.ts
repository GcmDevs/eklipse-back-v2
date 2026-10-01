import { Module } from '@nestjs/common';
import {
  CreateEmpleadoOrEntidadController,
  CreateGestionController,
  FetchByPatternController,
  GestionClinicaController,
  ObservacionesController,
  PacientesController,
  VehiculoCrudController,
} from './presentation/controllers';
import { ObservacionSource, UsuarioAreaRepository } from './infrastructure/repositories';
import {
  CreateEmpleadoOrEntidadService,
  CreateGestionService,
  DepartamentoByPatternService,
  EmpleadoByPatternService,
  EntidadByPatternService,
  GestionClinicaImpl,
  motTrasladoByPatternService,
  MunicipioByPatternService,
  PacientesService,
  ServicioByPatternService,
  TrasladoCrudImpl,
  VehiculoByPatternService,
} from './infrastructure/services';

@Module({
  controllers: [
    GestionClinicaController,
    PacientesController,
    FetchByPatternController,
    CreateGestionController,
    VehiculoCrudController,
    CreateEmpleadoOrEntidadController,
    ObservacionesController,
  ],
  providers: [
    GestionClinicaImpl,
    UsuarioAreaRepository,
    PacientesService,
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
    ObservacionSource,
  ],
})
export class GestionesModule {}
