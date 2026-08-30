import { Module } from '@nestjs/common';
import {
  AfnRecursosController,
  AfnTipoServicioTecnicoController,
  NotaServicioTecnicoController,
  ServicioTecnicoController,
} from './presentation/controllers';
import {
  CreateSolicitudServicioTecnicoSource,
  FetchHistoricoSolicitudServicioTecnicoSource,
  FetchSolicitudServicioTecnicoSource,
  NotaServicioTecnicoSource,
  SolicitudServicioTecnicoSource,
  UpdateSolicitudServicioTecnicoSource,
} from './infrastructure/repositories';
import { AfnRecursosImpl, AfnUsuarioTipoServicioImpl } from './infrastructure/services';
import { ServicioTecnicoBaseSource } from './infrastructure/bases';

@Module({
  controllers: [
    NotaServicioTecnicoController,
    ServicioTecnicoController,
    AfnTipoServicioTecnicoController,
    AfnRecursosController,
  ],
  providers: [
    NotaServicioTecnicoSource,
    ServicioTecnicoBaseSource,
    CreateSolicitudServicioTecnicoSource,
    UpdateSolicitudServicioTecnicoSource,
    FetchSolicitudServicioTecnicoSource,
    SolicitudServicioTecnicoSource,
    NotaServicioTecnicoSource,
    AfnRecursosImpl,
    AfnUsuarioTipoServicioImpl,
    FetchHistoricoSolicitudServicioTecnicoSource,
  ],
})
export class LgcAfnModule {}
