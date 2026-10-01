import { EklipseModule as OldEklipseModule } from '@sln/old/ekl/eklipse.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { RefactorizedModule } from '@sln/rft/refactorized.module';
import { RadicacionDeFacturacionModule } from './radicacion-de-facturacion/radicacion-de-facturacion.module';

@Module({
  imports: [OldEklipseModule, ConfigModule, RefactorizedModule, RadicacionDeFacturacionModule],
})
export class OldImportsModule {}
