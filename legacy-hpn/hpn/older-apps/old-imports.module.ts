import { GestionClinicaModule } from './gestion-clinica/gestion-clinica.module';
import { Module } from '@nestjs/common';
import { ReferenciaModule } from './referencia/referencia.module';
import { ValoresCriticosModule } from './valores-criticos/valores-criticos.module';
import { PruebaController } from './prueba';
import { ResourcesModule } from './resources/resources.module';
import { CamasModule } from './camas/camas.module';
import { CensusBedsModule } from './census-beds/census-beds.module';
import { CensusPatientsModule } from './census-patients/census-patients.module';
import { ObservacionesModule } from './observaciones/observaciones.module';
import { EstanciasModule } from './estancias/estancias.module';
import { SubgroupBedsModule } from './subgroup-beds/subgroup-beds.module';
import { ApisModule } from './apis/apis.module';
import { GestionsSalidaModule } from './gestion-salida/gestion-salida.module';

/** @deprecated */
@Module({
  controllers: [PruebaController],
  imports: [
    SubgroupBedsModule,
    EstanciasModule,
    GestionClinicaModule,
    ReferenciaModule,
    ValoresCriticosModule,
    ResourcesModule,
    CamasModule,
    CensusBedsModule,
    CensusPatientsModule,
    ObservacionesModule,
    GestionsSalidaModule,
    ApisModule,
  ],
})
export class OldImportsModule {}
