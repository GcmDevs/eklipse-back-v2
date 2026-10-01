import { Module } from '@nestjs/common';
import { PacientesModule } from './pacientes/pacientes.module';
import { GestionClinicaV1Module } from './v1/gestion-clinica.module';
import { GestionClinicaV2Module } from './v2/gestion-clinica.module';

@Module({
  imports: [PacientesModule, GestionClinicaV1Module, GestionClinicaV2Module],
})
export class GestionClinicaModule {}
