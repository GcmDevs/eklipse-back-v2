import { Module } from '@nestjs/common';
import { HistoriaClinicaModule } from '@hcn/rft/historia-clinica/historia-clinica.module';
import { OlderModule } from './@old/old.module';

const modules = [HistoriaClinicaModule, OlderModule];

@Module({
  imports: modules,
  exports: modules,
})
export class RefactorizedModule {}
