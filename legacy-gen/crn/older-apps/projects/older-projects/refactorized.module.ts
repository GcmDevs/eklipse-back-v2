import { Module } from '@nestjs/common';
import { CarteraModule } from '@crn/rft/cartera/cartera.module';
import { OlderModule } from './@old/old.module';

const modules = [
  CarteraModule,
  // Modulos antiguos
  OlderModule,
];

@Module({
  imports: modules,
  exports: modules,
})
export class RefactorizedModule {}
