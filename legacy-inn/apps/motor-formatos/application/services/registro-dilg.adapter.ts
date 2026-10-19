import { RegistroDilgService } from '@equipos/application/services/actividades/registo-dilg.across.service';
import { Inject, Injectable } from '@nestjs/common';
import {
  EstadoRegistroDilg,
  REGISTRO_DILIGENCIADO_REPOSITORY,
  RegistroDiligenciadoRepository,
} from 'apps/motor-formatos/domain';

@Injectable()
export class RegistroDilgValidatorAdapter implements RegistroDilgService {
  constructor(
    @Inject(REGISTRO_DILIGENCIADO_REPOSITORY)
    private readonly regDilgRepository: RegistroDiligenciadoRepository
  ) {}

  async findEstadoByRegActividadId(
    regActividadId: number
  ): Promise<{ estado: EstadoRegistroDilg; id: number } | null> {
    const regActividadFound = await this.regDilgRepository.findByRegActividad(regActividadId);

    if (!regActividadFound) return null;
    return { id: regActividadFound.getId.getValor, estado: regActividadFound.getEstado };
  }
}
