import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { AsignacionRecursoActividad } from '@equipos/domain/entities';
import { AsignacionRecursoActividadRead } from '@equipos/domain/read';
import { AsignacionRecursoActividadRepository } from '@equipos/domain/repositories';
import { AsignacionRecursoActividadMapper } from '@equipos/infrastructure/mappers/actividades';
import { Injectable } from '@nestjs/common';
import { AsingacionRecursoActividadOrm } from '@orm/inn/equipos/pool-recursos/asignacion-actividad-recurso.orm';

@Injectable()
export class TypeOrmAsignacionRecursoActividadRepository
  extends BaseSource
  implements AsignacionRecursoActividadRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(AsingacionRecursoActividadOrm)
      : this.conn.getRepository(AsingacionRecursoActividadOrm);
  }

  async save(domain: AsignacionRecursoActividad): Promise<AsignacionRecursoActividad> {
    const orm = AsignacionRecursoActividadMapper.toOrm(domain) as AsingacionRecursoActividadOrm;
    const saved = await this.repository.save(orm);
    return AsignacionRecursoActividadMapper.toDomain(saved);
  }

  async update(domain: AsignacionRecursoActividad): Promise<AsignacionRecursoActividad> {
    const orm = AsignacionRecursoActividadMapper.toOrm(domain) as AsingacionRecursoActividadOrm;
    await this.repository.save(orm);
    return this.findActivaByActividad(domain.getActividadId.getValor);
  }

  async findActivaByActividad(actividadId: number): Promise<AsignacionRecursoActividad | null> {
    const orm = await this.repository.findOne({
      where: { actividadId, activa: true },
    });
    return orm ? AsignacionRecursoActividadMapper.toDomain(orm) : null;
  }

  async findAllViewByActividad(actividadId: number): Promise<AsignacionRecursoActividadRead[]> {
    const founds = await this.repository.find({
      where: { actividadId },
      order: { fechaAsignacion: 'DESC' },
    });
    return AsignacionRecursoActividadMapper.toViewList(founds);
  }

  async findAllByRecurso(recursoId: number): Promise<AsignacionRecursoActividad[]> {
    const orms = await this.repository.find({
      where: { recursoId },
      order: { fechaAsignacion: 'DESC' },
    });
    return AsignacionRecursoActividadMapper.toDomainList(orms);
  }
}
