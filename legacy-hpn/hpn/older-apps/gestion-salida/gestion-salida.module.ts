import { Module } from '@nestjs/common';
import { GestionSalidaSource } from './gestion-salida.source';
import { GestionSalidaController } from './gestion-salida.controller';

@Module({
  controllers: [GestionSalidaController],
  providers: [GestionSalidaSource],
})
export class GestionsSalidaModule {}
