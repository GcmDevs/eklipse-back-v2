import { Module } from '@nestjs/common';
import {
  ProductoController,
  ProveedorController,
  EstadisticaController,
  SetController,
} from './presentation/controllers';
import { SetCrudSource } from './infrastructure/repositories';

@Module({
  controllers: [EstadisticaController, SetController, ProductoController, ProveedorController],
  providers: [SetCrudSource],
})
export class CotizacionesPrefabricadasModule {}
