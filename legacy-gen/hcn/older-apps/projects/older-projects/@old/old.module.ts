import { Module } from '@nestjs/common';
import { UciSheetsModule } from './uci-sheets/uci-sheets.module';

const modules = [UciSheetsModule];

@Module({
  imports: modules,
  exports: modules,
})
export class OlderModule {}
