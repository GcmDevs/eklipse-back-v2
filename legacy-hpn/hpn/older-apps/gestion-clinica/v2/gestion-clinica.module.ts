import { Module } from '@nestjs/common';
import { GestionClinicaController } from './gestion-clinica.controller';
import { GestionClinicaService } from './gestion-clinica.service';
import { UsuarioAreaRepository } from './repository/usario-area.repository';

@Module({
  controllers: [GestionClinicaController],
  providers: [GestionClinicaService, UsuarioAreaRepository],
})
export class GestionClinicaV2Module {}
