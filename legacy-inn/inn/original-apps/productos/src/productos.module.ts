import { Module } from '@nestjs/common';
import { FarmaciaModule } from './farmacia/farmacia.module';
import { ReporteActualController } from './reporte-actual.controller';

@Module({
  controllers: [ReporteActualController],
  imports: [FarmaciaModule],
})
export class ProductosModule {}
