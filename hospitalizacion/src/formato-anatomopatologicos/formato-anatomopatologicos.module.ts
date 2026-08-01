import { Module } from '@nestjs/common';
import { FormatoMuestrasAnatomopatologicasController } from './presentation/formato-anatomopatologicos.controller';
import { FormatoMuestrasAnatomopatologicasImpl } from './infraestructure/services';

@Module({
  controllers: [FormatoMuestrasAnatomopatologicasController],
  providers: [FormatoMuestrasAnatomopatologicasImpl],
})
export class FormatoAnatomopatologicosModule {}
