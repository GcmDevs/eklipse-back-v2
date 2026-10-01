import { Module } from '@nestjs/common';
import { DependenciasCrudSource } from './infrastructure/repositories';
import {
  DependenciaServicesController,
  DependenciasCrudController,
} from './presentation/controllers';
import { ManageDependenciaToUsuarioImpl } from './infrastructure/services';

@Module({
  controllers: [DependenciasCrudController, DependenciaServicesController],
  providers: [DependenciasCrudSource, ManageDependenciaToUsuarioImpl],
})
export class DependenciasModule {}
