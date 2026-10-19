import { Module } from '@nestjs/common';
import { CategoriaController, ProveedorController } from './presentation/controllers';
import { CategoriasImpl, ProveedoresImpl } from './infrastructure/services';

@Module({
  controllers: [CategoriaController, ProveedorController],
  providers: [CategoriasImpl, ProveedoresImpl],
})
export class proveedoresModule {}
