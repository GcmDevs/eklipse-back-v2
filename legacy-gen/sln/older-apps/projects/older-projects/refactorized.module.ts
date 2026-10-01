import { Module } from '@nestjs/common';
import { InformesGerencialesV2Module } from './informes-gerenciales/informes-gerenciales-v2.module';
import { OlderModule } from './@old/old.module';

const modules = [InformesGerencialesV2Module, OlderModule];

@Module({
  imports: modules,
  exports: modules,
})
export class RefactorizedModule {}
