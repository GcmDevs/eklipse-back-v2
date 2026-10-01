import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { GestionClinicaModule } from '@gestion-clinica/gestion-clinica.module';
import { HpnModule } from 'hpn/module';
import { AuditoriaModule } from '@auditoria/auditoria.module';
import { BoletaQuirurgicaModule } from '@boleta-quirurgica/boleta-quirurgica.module';
import { CamasModule } from './camas/module';
import { GestorEstanciaProlongadasModule } from '@gestor-estancia-prolongadas/gestor-estancia-prolongadas.module';
import { RotuloMedicamentosModule } from 'apps/rotulo-medicamentos/rotulo-medicamentos.module';

@Module({
  imports: [
    CamasModule,
    /** MODULOS VIEJOS */
    AuditoriaModule,
    BoletaQuirurgicaModule,
    RotuloMedicamentosModule,
    GestorEstanciaProlongadasModule,
    GestionClinicaModule,
    HpnModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES as any);
  }
}
