import { Module, OnModuleInit } from '@nestjs/common';
import { initializeSources } from '@common/infrastructure/services';
import { ENTITIES } from './app.entities';
import { PacientesModule } from './pacientes/module';
import { EstanciasProlongadasModule } from './estancias-prolongadas/estancia-prolongada.module';
import { RotuloMedicamentosModule } from './rotulo-medicamentos/rotulo-medicamentos.module';

@Module({
  imports: [
    // --- AVOID NOWRAP --- //
    PacientesModule,
    EstanciasProlongadasModule,
    RotuloMedicamentosModule,
  ],
})
export class AppModule implements OnModuleInit {
  public onModuleInit(): void {
    initializeSources(ENTITIES);
  }
}
