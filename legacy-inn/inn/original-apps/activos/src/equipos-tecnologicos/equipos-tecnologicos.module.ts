import { Module } from '@nestjs/common';
import {
  FetchByPatternController,
  EquipoTecnologicoCrudController,
  MantenimientoCrudController,
} from './presentation/controllers';
import {
  EquipoTecnologicoCrudSource,
  MantenimientoCrudSource,
} from './infrastructure/repositories';
import { FindByPatternImpl } from './infrastructure/services';

@Module({
  controllers: [
    EquipoTecnologicoCrudController,
    FetchByPatternController,
    MantenimientoCrudController,
  ],
  providers: [EquipoTecnologicoCrudSource, FindByPatternImpl, MantenimientoCrudSource],
})
export class EquiposTecnologicosModule {}
