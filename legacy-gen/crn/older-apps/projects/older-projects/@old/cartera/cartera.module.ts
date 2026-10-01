import { Module } from '@nestjs/common';
import { ConciliacionModule } from './conciliacion/conciliacion.module';
import { GestionModule } from './gestion/gestion.module';

@Module({
  imports: [ConciliacionModule, GestionModule],
  exports: [ConciliacionModule, GestionModule],
})
export class CarteraModule {}
