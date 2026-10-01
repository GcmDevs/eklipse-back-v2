import { Module } from '@nestjs/common';
import { RadicacionDeFacturacionService } from './radicacion-de-facturacion.service';
import { RadicacionDeFacturacionController } from './radicacion-de-facturacion.controller';
import { RadicacionRepository } from './repository';
import { RadicacionFacturacionController } from './presentation/controllers';
import { FacturaCrudHandler } from './presentation/handlers';
import { FacturaCrudSource } from './infrastructure/repositories';

@Module({
  controllers: [RadicacionDeFacturacionController, RadicacionFacturacionController],
  providers: [
    RadicacionDeFacturacionService,
    RadicacionRepository,
    FacturaCrudHandler,
    FacturaCrudSource,
  ],
})
export class RadicacionDeFacturacionModule {}
