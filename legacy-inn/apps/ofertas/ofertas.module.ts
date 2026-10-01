import { Module } from '@nestjs/common';
import { proveedoresModule } from './proveedores/proveedores.module';

@Module({
  imports: [proveedoresModule],
})
export class OfertasModule {}
