import { Module } from '@nestjs/common';
import { RotuloMedicamentosController } from './presentation/rotulo-medicamentos.controller';
import {
  ActualizarRotuloMedicamentosImpl,
  ByIngresoRotuloMedicamentosImpl,
  CensoRotuloMedicamentosImpl,
  DesactivarRotuloMedicamentoImpl,
  MedicamentosRotuloMedicamentosImpl,
  RegistrarRotuloMedicamentosImpl,
  RotuloMedicamentosImpl,
  TodosRotuloMedicamentosImpl,
} from './infraestructure/services';

@Module({
  controllers: [RotuloMedicamentosController],
  providers: [
    // Rotulo Medicamentos
    RotuloMedicamentosImpl,
    ByIngresoRotuloMedicamentosImpl,
    RegistrarRotuloMedicamentosImpl,
    MedicamentosRotuloMedicamentosImpl,
    CensoRotuloMedicamentosImpl,
    TodosRotuloMedicamentosImpl,
    DesactivarRotuloMedicamentoImpl,
    ActualizarRotuloMedicamentosImpl,
  ],
})
export class RotuloMedicamentosModule {}
