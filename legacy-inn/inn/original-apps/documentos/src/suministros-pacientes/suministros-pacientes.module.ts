import { Module } from '@nestjs/common';
import { SuministroPacienteCrudSource } from './infrastructure/repositories';
import {
  CustomDevolucionSumPacController,
  DevolucionSumPacController,
  SuministroPacienteCrudController,
} from './presentation/controllers';
import { CustomDevolucionSumpacImpl, DevolucionSumPacImpl } from './infrastructure/services';

@Module({
  controllers: [
    CustomDevolucionSumPacController,
    SuministroPacienteCrudController,
    DevolucionSumPacController,
  ],
  providers: [SuministroPacienteCrudSource, DevolucionSumPacImpl, CustomDevolucionSumpacImpl],
})
export class SuministrosPacientesModule {}
