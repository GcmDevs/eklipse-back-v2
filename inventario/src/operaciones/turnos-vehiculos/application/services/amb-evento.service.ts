import { EventoFlota } from '@inn/operaciones/turnos-vehiculos/domain/entities';
import { EntidadEventoFlota } from '@inn/operaciones/turnos-vehiculos/domain/enums';
import { AmbEventoRead } from '@inn/operaciones/turnos-vehiculos/domain/read';
import { EVENTO_FLOTA_REPOSITORY, EventoFlotaRepository } from '@inn/operaciones/turnos-vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import { FlotaSseBus } from './flota-sse.bus';

@Injectable()
export class AmbEventoService {
  constructor(
    @Inject(EVENTO_FLOTA_REPOSITORY) private readonly eventoRepo: EventoFlotaRepository,
    private readonly sseBus: FlotaSseBus,
  ) {}

  async registrar(params: {
    entidad: EntidadEventoFlota;
    entidadId: number;
    tipoEvento: string;
    usuarioId?: number;
    motivo?: string;
    detalle?: Record<string, unknown>;
    vehiculoId?: number;
  }): Promise<EventoFlota> {
    const evento = EventoFlota.create(params);
    const saved = await this.eventoRepo.append(evento);
    this.sseBus.publish({
      tipo: params.tipoEvento,
      entidad: params.entidad,
      entidadId: params.entidadId,
      vehiculoId: params.vehiculoId,
    });
    return saved;
  }

  async listar(entidad: string, entidadId: number): Promise<AmbEventoRead[]> {
    const eventos = await this.eventoRepo.findByEntidad(entidad, entidadId);
    return eventos.map(e => ({
      id: e.getId.getValor,
      entidad: e.getEntidad,
      entidadId: e.getEntidadId.getValor,
      tipoEvento: e.getTipoEvento,
      usuario: e.getUsuarioId ? { id: e.getUsuarioId.getValor, nombre: '' } : null,
      motivo: e.getMotivo,
      detalle: e.getDetalle,
      createdAt: e.getCreatedAt,
    }));
  }
}
