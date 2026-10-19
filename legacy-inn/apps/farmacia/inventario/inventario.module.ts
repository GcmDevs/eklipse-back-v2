import { Module } from '@nestjs/common';
import { InventarioController } from './presentation';
import {
  AgregarProductosImpl,
  AsignacionConteoImpl,
  CerrarConteoImpl,
  ConteoInventarioService,
  ConsultaInventarioService,
  EstanteInventarioImpl,
  ProductoEstanteImpl,
  UsuarioConteoImpl,
} from './infraestructure/services';

@Module({
  controllers: [InventarioController],
  providers: [
    AsignacionConteoImpl,
    EstanteInventarioImpl,
    ProductoEstanteImpl,
    UsuarioConteoImpl,
    ConteoInventarioService,
    ConsultaInventarioService,
    AgregarProductosImpl,
    CerrarConteoImpl,
  ],
  imports: [],
})
export class InventarioModule {}
