import { Module } from '@nestjs/common';
import { RecepcionTecnicaModule } from './recepcion-tecnica/recepcion-tecnica.module';

@Module({
  imports: [RecepcionTecnicaModule],
})
export class InventarioModule2 {}
