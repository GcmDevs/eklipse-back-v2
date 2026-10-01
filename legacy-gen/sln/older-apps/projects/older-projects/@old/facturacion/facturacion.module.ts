import { Module } from '@nestjs/common';
import { ConceptoDeAdmisionModule } from './concepto-de-admision/concepto-de-admision.module';

@Module({
  imports: [ConceptoDeAdmisionModule],
  exports: [ConceptoDeAdmisionModule],
})
export class FacturacionModule {}
