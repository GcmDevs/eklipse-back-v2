import { Module } from '@nestjs/common';
import { RotuloMedicamentosImpl } from './infraestructure/repositories/rotulo-medicamentos.impl';
import { RotuloMedicamentosController } from './presentation/controller/rotulo-medicamentos.controller';
import {
  TodosRotuloMedicamentosImpl,
  ByIngresoRotuloMedicamentosImpl,
  RegistrarRotuloMedicamentosImpl,
  MedicamentosRotuloMedicamentosImpl,
  CensoRotuloMedicamentosImpl,
} from './infraestructure/repositories';

@Module({
  controllers: [RotuloMedicamentosController],
  providers: [
    RotuloMedicamentosImpl,
    TodosRotuloMedicamentosImpl,
    ByIngresoRotuloMedicamentosImpl,
    RegistrarRotuloMedicamentosImpl,
    MedicamentosRotuloMedicamentosImpl,
    CensoRotuloMedicamentosImpl,
  ],
})
export class RotuloMedicamentosModule {}
