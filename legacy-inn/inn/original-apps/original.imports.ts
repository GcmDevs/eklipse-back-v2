import { Module } from '@nestjs/common';
import { DocumentosModule } from './documentos/src/documentos.module';
import { CotizacionesPrefabricadasModule } from './cotizaciones-prefabricadas/cotizaciones-prefabricadas.module';
import { ProductosModule } from './productos/src/productos.module';
import { _22ProductosModule } from './servicios/src/servicios.module';
import { ActivosModule } from './activos/src/activos.module';

/** @deprecated */
@Module({
  imports: [
    DocumentosModule,
    CotizacionesPrefabricadasModule,
    ProductosModule,
    _22ProductosModule,
    ActivosModule,
  ],
})
export class OriginalImportsModule {}
