import { Module } from '@nestjs/common';
import { FormatoMuestrasAnatomopatologicasController } from './presentation/formato-anatomopatologicos.controller';
import { BuscarPacienteCensoFormatoImpl } from './infraestructure/services';

@Module({
  controllers: [FormatoMuestrasAnatomopatologicasController],
  providers: [BuscarPacienteCensoFormatoImpl],
})
export class FormatoAnatomopatologicosModule {}
