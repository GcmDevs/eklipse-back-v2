import { Module } from '@nestjs/common';
import { OrdenDespachoSource } from './infrastructure/repositories';
import { OrdenDespachoController, SuministroPacienteController } from './presentation/controllers';

@Module({
  controllers: [OrdenDespachoController, SuministroPacienteController],
  providers: [OrdenDespachoSource],
})
export class DocumentosModule {}
