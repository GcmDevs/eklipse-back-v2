import { Module } from '@nestjs/common';
import { InnCiclicoModule } from './inn-ciclico/inn-ciclico.module';
import { FarmaciaModule } from './farmacia/farmacia.module';

@Module({
  imports: [InnCiclicoModule, FarmaciaModule],
})
export class AppsImportsModule {}
