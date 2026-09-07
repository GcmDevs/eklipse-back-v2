import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { LgcCtcModule } from '@inn/lgc/ctc/module';
import { LgcAfnModule } from '@inn/lgc/afn/activos-fijos.module';
import { LgcRctModule } from '@inn/lgc/rct/recepcion-tecnica.module';
import { DocumentosModule } from './documentos/module';
import { MAOSModule } from './maos/module';
import { CentralMezclasModule } from './central-mezclas/module';
import { SolicitudPedidoModule } from './solicitud-pedido/solicitud-pedido.module';
import * as fs from 'fs';
import { FOLDERS_STRINGS } from './folders';
import { CloudController } from './cloud.controller';

@Module({
  controllers: [CloudController],
  imports: [
    LgcCtcModule,
    LgcAfnModule,
    LgcRctModule,
    DocumentosModule,
    MAOSModule,
    CentralMezclasModule,
    SolicitudPedidoModule,
  ],
})
export class AppModule implements OnModuleInit {
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
