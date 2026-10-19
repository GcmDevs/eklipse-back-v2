import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { InventarioModule1 } from './projects/older-projects/inventario/inventario.module';
import { InventarioModule2 } from './projects/inventario/src/inventario.module';

/** @deprecated */
@Module({
  imports: [ConfigModule, InventarioModule1, InventarioModule2],
})
export class OldImportsModule {}
