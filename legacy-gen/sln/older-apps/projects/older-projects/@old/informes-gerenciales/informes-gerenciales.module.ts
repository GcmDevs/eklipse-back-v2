import { Module } from '@nestjs/common';
import { RadicacionDeFacturacionModule } from './radicacion-de-facturacion/radicacion-de-facturacion.module';
import { FacturacionPorPeriodoModule } from './facturacion-por-periodo/facturacion-por-periodo.module';
import { PgpController } from './estadistico-pgp/pgp.controller';
import { PgpService } from './estadistico-pgp/pgp.service';
import {
  PgpRepository,
  PgpAcostado,
  PgpConsolidado,
  PgpFacturado,
} from './estadistico-pgp/repository';

@Module({
  controllers: [PgpController],
  providers: [PgpService, PgpRepository, PgpAcostado, PgpConsolidado, PgpFacturado],
  imports: [RadicacionDeFacturacionModule, FacturacionPorPeriodoModule],
  exports: [RadicacionDeFacturacionModule, FacturacionPorPeriodoModule],
})
export class InformesGerencialesModule {}
