import { ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { EntidadEventoFlota, EstadoNovedadDotacion } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import {
  DOTACION_NOVEDAD_REPOSITORY,
  DotacionNovedadRepository,
} from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { AmbEventoService } from './amb-evento.service';

@Injectable()
export class NovedadService {
  constructor(
    @Inject(DOTACION_NOVEDAD_REPOSITORY) private readonly novedadRepo: DotacionNovedadRepository,
    private readonly eventoService: AmbEventoService,
  ) {}

  async listar(estado?: EstadoNovedadDotacion): Promise<{ items: unknown[]; total: number }> {
    const [items, total] = await this.novedadRepo.search({
      estado,
      page: 1,
      pageSize: 50,
    });
    return { items, total };
  }

  async resolver(id: number, observacion: string) {
    const usuario = getUser();
    const novedad = await this.novedadRepo.findById(id);
    if (!novedad) throw new ResourceNotFoundError('Novedad no encontrada');
    novedad.resolver(usuario.id, observacion, new Date());
    await this.novedadRepo.update(novedad);
    await this.eventoService.registrar({
      entidad: EntidadEventoFlota.NOVEDAD,
      entidadId: id,
      tipoEvento: 'NOVEDAD_RESUELTA',
      usuarioId: usuario.id,
    });
    return novedad;
  }
}
