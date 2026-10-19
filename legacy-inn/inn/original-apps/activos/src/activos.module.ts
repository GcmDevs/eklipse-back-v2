import { Module } from '@nestjs/common';
import { EquiposTecnologicosModule } from './equipos-tecnologicos/equipos-tecnologicos.module';

@Module({
  imports: [EquiposTecnologicosModule],
})
export class ActivosModule {}
