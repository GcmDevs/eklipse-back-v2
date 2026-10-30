import { initializeSources } from '@common/infrastructure/services';
import { RequestContextMiddleware } from '@common/presentation/interceptors';
import { LgcAfnModule } from '@inn/lgc/afn/activos-fijos.module';
import { LgcCgtModule } from '@inn/lgc/cgt/module';
import { LgcCtcModule } from '@inn/lgc/ctc/module';
import { LgcRctModule } from '@inn/lgc/rct/recepcion-tecnica.module';
import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import { EquiposModule } from './activos/identificacion/equipos.module';
import { ReportsModule } from './activos/reports/reports.module';
import { ENTITIES } from './app.entities';
import { CentralMezclasModule } from './central-mezclas/module';
import { CloudController } from './cloud.controller';
import { COR_MODULES } from './core';
import { DocumentosModule } from './documentos/module';
import { FOLDERS_STRINGS } from './folders';
import { InvimaModule } from './invima/invima.module';
import { MAOSModule } from './maos/module';
import { MotorFormatosModule } from './motor-formatos/motor-formatos.module';
import { VehiculosModule } from './operaciones/tanqueos/vehiculos.module';
import { FlotaModule } from './operaciones/turnos-vehiculos/flota.module';
import { RondasHabitacionesModule } from './rondas-habitaciones/rondas-habitaciones.module';
import { SolicitudPedidoModule } from './solicitud-pedido/solicitud-pedido.module';

@Module({
  controllers: [CloudController],
  imports: [
    LgcCtcModule,
    LgcAfnModule,
    LgcRctModule,
    LgcCgtModule,
    DocumentosModule,
    MAOSModule,
    CentralMezclasModule,
    SolicitudPedidoModule,
    RondasHabitacionesModule,
    InvimaModule,
    EquiposModule,
    MotorFormatosModule,
    ReportsModule,
    VehiculosModule,
    FlotaModule,
    ...COR_MODULES,
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }

  public async onModuleInit(): Promise<void> {
    initializeSources(ENTITIES);

    fs.mkdir(`../temp`, err => {
      if (err) return;
    });

    for (let index = 0; index < FOLDERS_STRINGS.length; index++) {
      const f = FOLDERS_STRINGS[index];
      const interval = setInterval(() => {
        if (!fs.existsSync(`../public/${f}`) || !fs.existsSync(`../removed/${f}`)) {
          fs.mkdir(`../public/${f}`, { recursive: true }, err => {
            if (err) return;
          });
          fs.mkdir(`../removed/${f}`, { recursive: true }, err => {
            if (err) return;
          });
        } else clearInterval(interval);
      }, 10);
    }
  }
}
