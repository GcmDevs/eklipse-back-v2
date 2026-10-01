import { Module } from '@nestjs/common';
import { ConceptoDeAdmisionService } from './concepto-de-admision.service';
import { ConceptoDeAdmisionController } from './concepto-de-admision.controller';
import { ConceptoRepository } from './repository';

@Module({
  providers: [ConceptoDeAdmisionService, ConceptoRepository],
  controllers: [ConceptoDeAdmisionController],
})
export class ConceptoDeAdmisionModule {}
