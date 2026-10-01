import { Module } from '@nestjs/common';
import { GestionesModule } from './gestiones/gestiones.module';
import { EntregaTurnosModule } from './entrega-turnos/entrega-turnos.module';
import { TrasladosAsistencialesModule } from './traslados-asistenciales/traslados-asistenciales.module';

@Module({
  imports: [GestionesModule, EntregaTurnosModule /* TrasladosAsistencialesModule */],
})
export class GestionClinicaModule {}
