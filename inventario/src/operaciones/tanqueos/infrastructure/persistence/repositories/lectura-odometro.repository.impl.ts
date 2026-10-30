import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { LecturaOdometro } from '@inn/operaciones/tanqueos/domain/entities';
import { LecturaOdometroRead } from '@inn/operaciones/tanqueos/domain/reads/lectura-odometro.read';
import { FuenteLecturaOdometro } from '@inn/operaciones/tanqueos/domain/enums';
import {
  LecturaOdometroReferencia,
  LecturaOdometroRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { LecturaOdometroMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { LecturaOdometroOrm } from '../orm';

export class TypeOrmLecturaOdometroRepository
  extends BaseSource
  implements LecturaOdometroRepository
{
  private get repository() {
    return resolveRepository(this.conn, LecturaOdometroOrm);
  }

  async save(lectura: LecturaOdometro): Promise<LecturaOdometro> {
    const saved = await this.repository.save(LecturaOdometroMapper.toOrm(lectura));
    return LecturaOdometroMapper.toDomain(
      await this.repository.findOne({ where: { id: saved.id }, relations: ['usuario'] })
    );
  }

  async findLatestConfiableKm(activoId: number): Promise<number | null> {
    const ref = await this.findLatestConfiableReferencias([activoId]);
    return ref.get(activoId)?.kilometraje ?? null;
  }

  async findLatestConfiableKmAntesDelTanqueo(
    activoId: number,
    fechaTanqueo: Date,
    tanqueoId?: number | null
  ): Promise<number | null> {
    const qb = this.repository
      .createQueryBuilder('lectura')
      .where('lectura.activoId = :activoId', { activoId })
      .andWhere('lectura.confiable = :confiable', { confiable: true });

    if (tanqueoId != null) {
      qb.andWhere(
        `(lectura.fechaLectura < :fechaTanqueo OR (lectura.fechaLectura = :fechaTanqueo AND (lectura.fuente != :fuenteTanqueo OR lectura.referenciaId < :tanqueoId)))`,
        {
          fechaTanqueo,
          fuenteTanqueo: FuenteLecturaOdometro.TANQUEO,
          tanqueoId,
        }
      );
    } else {
      qb.andWhere('lectura.fechaLectura < :fechaTanqueo', { fechaTanqueo });
    }

    const row = await qb
      .orderBy('lectura.fechaLectura', 'DESC')
      .addOrderBy('lectura.id', 'DESC')
      .getOne();
    return row?.lectura ?? null;
  }

  async findLatestConfiableReferencias(
    activoIds: number[]
  ): Promise<Map<number, LecturaOdometroReferencia>> {
    const map = new Map<number, LecturaOdometroReferencia>();
    if (!activoIds.length) return map;

    const rows = await this.repository
      .createQueryBuilder('lectura')
      .where('lectura.activoId IN (:...activoIds)', { activoIds })
      .andWhere('lectura.confiable = :confiable', { confiable: true })
      .orderBy('lectura.fechaLectura', 'DESC')
      .addOrderBy('lectura.id', 'DESC')
      .getMany();

    for (const row of rows) {
      if (!map.has(row.activoId)) {
        map.set(row.activoId, {
          kilometraje: row.lectura,
          fechaReferencia: row.fechaLectura,
        });
      }
    }
    return map;
  }

  async findByTanqueoId(tanqueoId: number): Promise<LecturaOdometro | null> {
    const orm = await this.repository.findOne({
      where: { fuente: FuenteLecturaOdometro.TANQUEO, referenciaId: tanqueoId },
      relations: ['usuario'],
    });
    return orm ? LecturaOdometroMapper.toDomain(orm) : null;
  }

  async findByActivoOrdered(activoId: number): Promise<LecturaOdometro[]> {
    const orms = await this.repository.find({
      where: { activoId },
      relations: ['usuario'],
      order: { fechaLectura: 'ASC', id: 'ASC' },
    });
    return orms.map(LecturaOdometroMapper.toDomain);
  }

  async findHistoryByActivo(
    activoId: number,
    page: number,
    limit: number
  ): Promise<[LecturaOdometroRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      where: { activoId },
      relations: ['usuario'],
      order: { fechaLectura: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return [LecturaOdometroMapper.toViewList(orms), count];
  }
}
