import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TipoDocCategoriaActivo } from '@equipos/domain/entities/catalogo/tipo-doc-categoria-activo.entity';
import { TipoDocCategoriaActivoRead } from '@equipos/domain/read';
import {
  TipoDocCategoriaActivoFindAllFilters,
  TipoDocCategoriaActivoRepository,
} from '@equipos/domain/repositories/catalogo/tipo-doc-categoria-activo.repository';
import { TipoDocCategoriaActivoMapper } from '@equipos/infrastructure/mappers/catalogo/tipo-doc-categoria-activo.mapper';
import { Injectable } from '@nestjs/common';
import { TipoActivoOrm } from '@orm/inn/equipos/catalogo/tipo-activo.orm';
import { TipoDocCategoriaActivoOrm } from '@orm/inn/equipos/catalogo/tipo-doc-categoria-activo.orm';
import { In } from 'typeorm';

@Injectable()
export class TypeOrmTipoDocCategoriaActivoRepository
  extends BaseSource
  implements TipoDocCategoriaActivoRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(TipoDocCategoriaActivoOrm)
      : this.conn.getRepository(TipoDocCategoriaActivoOrm);
  }

  async save(domain: TipoDocCategoriaActivo): Promise<TipoDocCategoriaActivo> {
    const orm = TipoDocCategoriaActivoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return TipoDocCategoriaActivoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<TipoDocCategoriaActivo | null> {
    const orm = await this.repository.findOne({ where: { id } });
    return orm ? TipoDocCategoriaActivoMapper.toDomain(orm) : null;
  }

  async findAll({
    tipoActivoId,
    categoria,
    search,
    limit,
  }: TipoDocCategoriaActivoFindAllFilters): Promise<TipoDocCategoriaActivoRead[]> {
    const qb = this.repository.createQueryBuilder('tipoDoc').orderBy('tipoDoc.nombre', 'ASC');
    if (categoria?.trim()) {
      qb.andWhere('tipoDoc.categoria = :categoria', { categoria });
    }
    if (search?.trim()) {
      qb.andWhere('tipoDoc.nombre LIKE :search', { search: `%${search.trim()}%` });
    }
    if (limit) {
      qb.take(limit);
    }

    let orms = await qb.getMany();

    if (tipoActivoId !== undefined) {
      orms = orms.filter(orm => orm.reglasTipoActivo?.aplicaParaTipoActivo(tipoActivoId));
    }

    const tipoActivoNombres = await this.loadTipoActivoNombres(orms);
    return TipoDocCategoriaActivoMapper.toViewList(orms, tipoActivoNombres, tipoActivoId);
  }

  async update(domain: TipoDocCategoriaActivo): Promise<TipoDocCategoriaActivo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[TipoDocCategoriaActivoRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { nombre: 'ASC' },
    });
    const tipoActivoNombres = await this.loadTipoActivoNombres(orms);
    return [TipoDocCategoriaActivoMapper.toViewList(orms, tipoActivoNombres), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<TipoDocCategoriaActivoRead | null> {
    const orm = await this.repository.findOne({ where: { id } });
    if (!orm) return null;
    const tipoActivoNombres = await this.loadTipoActivoNombres([orm]);
    return TipoDocCategoriaActivoMapper.toView(orm, tipoActivoNombres);
  }

  private async loadTipoActivoNombres(
    orms: TipoDocCategoriaActivoOrm[]
  ): Promise<Map<number, string>> {
    const ids = new Set<number>();
    for (const orm of orms) {
      for (const regla of orm.reglasTipoActivo?.getReglas() ?? []) {
        ids.add(regla.tipoActivoId);
      }
    }
    if (!ids.size) return new Map();

    const tipos = await this.conn.getRepository(TipoActivoOrm).find({
      where: { id: In([...ids]) },
      select: ['id', 'nombre'],
    });

    return new Map(tipos.map(t => [t.id, t.nombre]));
  }
}
