import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { SolicitudAprobacion } from '@equipos/domain/entities';
import { EstadoSolicitud, TipoAccionAprobacion } from '@equipos/domain/enums';
import { SolicitudRead } from '@equipos/domain/read';
import { SolicitudRepository } from '@equipos/domain/repositories';
import { SolicitudAprobacionMapper } from '@equipos/infrastructure/mappers';
import { FilterSolicitudDto } from '@equipos/presentation/dto';
import { Injectable } from '@nestjs/common';
import { SolicitudAprobacionOrm } from '@orm/inn/equipos';

@Injectable()
export class TypeOrmSolicitudAprobacionRepository
  extends BaseSource
  implements SolicitudRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(SolicitudAprobacionOrm)
      : this.conn.getRepository(SolicitudAprobacionOrm);
  }

  async save(solicitud: SolicitudAprobacion): Promise<SolicitudAprobacion> {
    const orm = SolicitudAprobacionMapper.toOrm(solicitud);
    const saved = await this.repository.save(orm);
    return SolicitudAprobacionMapper.toDomain(saved);
  }

  async update(solicitud: SolicitudAprobacion): Promise<SolicitudAprobacion> {
    const orm = SolicitudAprobacionMapper.toUpdateOrm(solicitud);
    const saved = await this.repository.save(orm);
    return SolicitudAprobacionMapper.toDomain(saved);
  }

  async findById(id: number): Promise<SolicitudAprobacion | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? SolicitudAprobacionMapper.toDomain(orm) : null;
  }

  async findViewById(id: number): Promise<SolicitudRead | null> {
    const orm = await this.repository.findOne({ where: { id }, relations: ['equipo'] });
    return orm ? SolicitudAprobacionMapper.toView(orm) : null;
  }

  async findAllView(filters: FilterSolicitudDto): Promise<[SolicitudRead[], number]> {
    const qb = this.repository
      .createQueryBuilder('soli')
      .leftJoinAndSelect('soli.equipo', 'equipo');

    if (filters.equipoId) qb.andWhere('soli.equipoId = :equipoId', { equipoId: filters.equipoId });
    if (filters.estado) qb.andWhere('soli.estado = :estado', { estado: filters.estado });
    if (filters.tipo) qb.andWhere('soli.tipoAccion = :tipo', { tipo: filters.tipo });
    if (filters.search) {
      const search = filters.search.trim();
      qb.andWhere(
        `(soli.solicitanteNombre LIKE :search) OR CAST(soli.numero AS VARCHAR) LIKE :search`,
        {
          search: `%${search}%`,
        }
      );
    }

    qb.orderBy('soli.createdAt', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit);

    const [orms, count] = await qb.getManyAndCount();
    return [orms.map(SolicitudAprobacionMapper.toView), count];
  }

  async existPendiente(equipoId: number, tipo: TipoAccionAprobacion): Promise<boolean> {
    return this.repository.exists({
      where: { equipoId, tipoAccion: tipo, estado: EstadoSolicitud.PENDIENTE },
    });
  }
}
