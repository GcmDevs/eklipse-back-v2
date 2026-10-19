import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import { EventoAuditEquipoRead, IncidenciaExternaEquipoRead } from '@equipos/domain/read';
import {
  EVENTO_AUDIT_EQUIPO_REPOSITORY,
  EventoAuditEquipoRepository,
} from '@equipos/domain/repositories';
import { WorkflowOrderBy } from '@equipos/presentation/dto';
import { Inject, Injectable } from '@nestjs/common';
import { RegisterEventoAuditInput } from '../events/metadata/register-evento.input';

@Injectable()
export class AuditEquipoService {
  constructor(
    @Inject(EVENTO_AUDIT_EQUIPO_REPOSITORY)
    private readonly eventoRepository: EventoAuditEquipoRepository
  ) {}

  async findMaxSecuenciaByCorrelationId(correlationId: string): Promise<number> {
    return this.eventoRepository.findMaxSecuenciaByCorrelationId(correlationId);
  }

  async register<T extends TipoEventoAuditEquipo>(
    input: RegisterEventoAuditInput<T>
  ): Promise<EventoAuditEquipoRead> {
    return await this.eventoRepository.save({
      equipoId: input.equipoId,
      tipo: input.tipo,
      descripcion: input.descripcion,
      usuarioId: input.autor.id,
      usuarioNombre: input.autor.nombre,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      referenciaEntidad: input.referenciaEntidad ?? null,
      referenciaId: input.referenciaId ?? null,
      correlationId: input.correlationId,
      secuencia: input.secuencia,
      createdAt: new Date(),
    });
  }

  async getByEquipo(
    equipoId: number,
    page: number,
    limit: number,
    tipo?: TipoEventoAuditEquipo
  ): Promise<[EventoAuditEquipoRead[], number]> {
    return this.eventoRepository.findByEquipo(equipoId, page, limit, tipo);
  }

  async getWorkflowsByEquipo(
    equipoId: number,
    page: number,
    limit: number,
    orderBy?: WorkflowOrderBy
  ) {
    return this.eventoRepository.findWorkflowsByEquipoQuery(
      equipoId,
      page,
      limit,
      orderBy ?? WorkflowOrderBy.LAST_ACTIVITY
    );
  }

  async getIncidenciasExternasByEquipo(equipoId: number): Promise<IncidenciaExternaEquipoRead[]> {
    return this.eventoRepository.findIncidenciasExternasByEquipo(equipoId);
  }
}
