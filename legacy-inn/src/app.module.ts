import { ActivosFijosModule } from '@activos-fijos/activos-fijos.module';
import { initializeSources } from '@common/infrastructure/services';
import { DocumentosModule as ViejoDocumentoModule } from '@documentos/documentos.module';
import { FarmaciaModule } from '@farmacia/farmacia.module';
import { Module, OnModuleInit } from '@nestjs/common';
import { ProductosModule } from '@productos/productos.module';
import { OfertasModule } from 'apps/ofertas/ofertas.module';
import * as fs from 'fs';
import { InnModule } from 'inn/module';
import { ENTITIES } from './app.entities';
import { CloudController } from './cloud.controller';
import { DocumentosModule } from './documentos/module';
import { FOLDERS_STRINGS } from './folders';
import { MaterialesOsteosintesisModule } from './material-osteosintesis/module';

@Module({
  controllers: [CloudController],
  imports: [
    MaterialesOsteosintesisModule,
    DocumentosModule,
    InnModule,
    ActivosFijosModule,
    ViejoDocumentoModule,
    ProductosModule,
    FarmaciaModule,
    OfertasModule,
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
