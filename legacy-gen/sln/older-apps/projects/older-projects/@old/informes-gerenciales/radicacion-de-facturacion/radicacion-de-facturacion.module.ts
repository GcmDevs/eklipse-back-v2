import { Module } from '@nestjs/common';
import { RadicacionDeFacturacionService } from './radicacion-de-facturacion.service';
import { RadicacionDeFacturacionController } from './radicacion-de-facturacion.controller';
import { RadicacionRepository } from './repository';

@Module({
  providers: [RadicacionDeFacturacionService, RadicacionRepository],
  controllers: [RadicacionDeFacturacionController],
})
export class RadicacionDeFacturacionModule {}
