import { Module } from '@nestjs/common';
import { CarteraModule } from './cartera/cartera.module';

const modules = [CarteraModule];

@Module({
  imports: modules,
  exports: modules,
})
export class OlderModule {}
