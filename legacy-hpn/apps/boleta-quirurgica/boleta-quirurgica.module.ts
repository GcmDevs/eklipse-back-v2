import { Module } from '@nestjs/common';
import { BoletaQuirurgicaController } from './presentation/controllers';
import { BoletaQuirurgicaImpl } from './infraestructure/repositories';

@Module({
  controllers: [BoletaQuirurgicaController],
  providers: [BoletaQuirurgicaImpl],
})
export class BoletaQuirurgicaModule {}
