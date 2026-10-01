import { Module } from '@nestjs/common';
//import { GCVUSUFACTUR } from './entity';
import { FacturacionPorPeriodoController } from './facturacion-por-periodo.controller';
import { FacturacionPorPeriodoService } from './facturacion-por-periodo.service';
//import { Helpers } from './helpers';
import { FacturacionRepository } from './repository';
import { FacturacionUsuarioRepository } from './repository/facturacionUsuario.repository';

/** @deprecated Use the v2 */

@Module({
  controllers: [FacturacionPorPeriodoController],
  providers: [FacturacionPorPeriodoService, FacturacionRepository, FacturacionUsuarioRepository],
})
export class FacturacionPorPeriodoModule {}
