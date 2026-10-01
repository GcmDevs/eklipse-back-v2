import { Module } from '@nestjs/common';
import { ServiciosModule } from './farmacia/servicios.module';

@Module({
  imports: [ServiciosModule],
})
export class _22ProductosModule {}
