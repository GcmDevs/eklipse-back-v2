import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TipoEventoAuditEquipo } from '@equipos/domain/enums/tipos-audit-equipo.enum';
import {
  EventoAuditEquipoRead,
  EventoAuditEquipoWorkflowRead,
  IncidenciaExternaEquipoRead,
} from '@equipos/domain/read';
import { EventoAuditEquipoRepository } from '@equipos/domain/repositories';
import { EventoAuditEquipoMapper } from '@equipos/infrastructure/mappers';
import { WorkflowOrderBy } from '@equipos/presentation/dto';
import { Injectable } from '@nestjs/common';
import {
  EquipoOrm,
  EventoAuditEquipoOrm,
  IncidenciasExternasEquiposGestserView,
} from '@orm/inn/equipos';

@Injectable()
export class TypeOrmEventoEquipoRepository
  extends BaseSource
  implements EventoAuditEquipoRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(EventoAuditEquipoOrm)
      : this.conn.getRepository(EventoAuditEquipoOrm);
  }

  private get equipoRepository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(EquipoOrm) : this.conn.getRepository(EquipoOrm);
  }

  private get incidenciasExternasRepository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(IncidenciasExternasEquiposGestserView)
      : this.conn.getRepository(IncidenciasExternasEquiposGestserView);
  }

  async save(evento: Omit<EventoAuditEquipoOrm, 'id'>): Promise<EventoAuditEquipoRead> {
    const eventoAudit = await this.repository.save(this.repository.create(evento));
    return EventoAuditEquipoMapper.toView(eventoAudit);
  }

  async findMaxSecuenciaByCorrelationId(correlationId: string): Promise<number> {
    const raw = await this.repository
      .createQueryBuilder('event')
      .select('MAX(event.secuencia)', 'max')
      .where('event.correlationId = :correlationId', { correlationId })
      .getRawOne<{ max: number | null }>();

    return raw?.max ?? 0;
  }

  async findByEquipo(
    equipoId: number,
    page: number,
    limit: number,
    tipo?: TipoEventoAuditEquipo
  ): Promise<[EventoAuditEquipoRead[], number]> {
    const qb = this.repository
      .createQueryBuilder('e')
      .where('e.equipoId = :equipoId', { equipoId })
      .orderBy('e.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tipo) {
      qb.andWhere('e.tipo = :tipo', { tipo });
    }

    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(evento => EventoAuditEquipoMapper.toView(evento)), count];
  }

  async findWorkflowsByEquipoQuery(
    equipoId: number,
    page: number,
    limit: number,
    orderBy: WorkflowOrderBy
  ): Promise<[EventoAuditEquipoWorkflowRead[], number]> {
    const eventos = await this.repository
      .createQueryBuilder('event')
      .where('event.equipoId = :equipoId', { equipoId })
      .orderBy('event.secuencia', 'ASC')
      .addOrderBy('event.createdAt', 'ASC')
      .getMany();

    const grouped = new Map<string, EventoAuditEquipoOrm[]>();

    for (const evento of eventos) {
      const correlationId = evento.correlationId ?? `single-${evento.id}`;

      if (!grouped.has(correlationId)) {
        grouped.set(correlationId, []);
      }

      grouped.get(correlationId)!.push(evento);
    }

    let workflows = Array.from(grouped.entries()).map(([correlationId, eventos]) =>
      EventoAuditEquipoMapper.toWorkflowView(correlationId, eventos)
    );

    workflows.sort((a, b) => {
      if (orderBy === WorkflowOrderBy.ROOT_DATE) {
        return a.rootActivityAt.getTime() - b.rootActivityAt.getTime();
      }

      return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
    });

    const total = workflows.length;
    const start = (page - 1) * limit;
    const end = start + limit;

    return [workflows.slice(start, end), total];
  }

  async findIncidenciasExternasByEquipo(equipoId: number): Promise<IncidenciaExternaEquipoRead[]> {
    const equipo = await this.equipoRepository.findOne({
      where: { id: equipoId },
      select: { id: true, numeroPlaca: true },
    });

    if (!equipo?.numeroPlaca) return [];

    const incidencias = await this.incidenciasExternasRepository
      .createQueryBuilder('incidencia')
      .where('incidencia.placa = :placa', { placa: equipo.numeroPlaca })
      .orderBy('incidencia.fechaCreacion', 'DESC')
      .getMany();

    return incidencias.map(incidencia =>
      EventoAuditEquipoMapper.toIncidenciaExternaView(incidencia)
    );
  }
}
