import { Module } from '@nestjs/common';
import { RecepcionTecnicaModule } from './recepcion-tecnica/recepcion-tecnica.module';
import { AdmisionesModule } from './admisiones/admisiones.module';

const modules = [AdmisionesModule, RecepcionTecnicaModule];

@Module({ imports: modules, exports: modules })
export class InventarioModule1 {}
