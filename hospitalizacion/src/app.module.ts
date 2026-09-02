import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { LgcTasModule } from '@hpn/lgc/tas/traslados-asistenciales.module';
import { LgcAudModule } from '@hpn/lgc/aud/auditoria.module';
import { PacientesModule } from './pacientes/module';
import { EstanciasProlongadasModule } from './estancias-prolongadas/estancia-prolongada.module';
import { RotuloMedicamentosModule } from './rotulo-medicamentos/rotulo-medicamentos.module';
import { FormatoAnatomopatologicosModule } from './formato-anatomopatologicos/formato-anatomopatologicos.module';
import { SeguimientoQuirurgicoModule } from './seguimiento-quirurgico/seguimiento-quirurgico.module';
import { ENTITIES } from './app.entities';

@Module({
  imports: [
    LgcTasModule,
    LgcAudModule,
    PacientesModule,
    EstanciasProlongadasModule,
    RotuloMedicamentosModule,
    FormatoAnatomopatologicosModule,
    SeguimientoQuirurgicoModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES);
  }
}
