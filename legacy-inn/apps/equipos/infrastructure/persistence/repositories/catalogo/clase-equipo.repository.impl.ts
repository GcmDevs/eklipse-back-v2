import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { ClaseEquipo } from '@equipos/domain/entities/catalogo/clase-equipo.entity';
import { ClaseEquipoRead } from '@equipos/domain/read';
import { ClaseEquipoRepository } from '@equipos/domain/repositories/catalogo/clase-equipo.repository';
import { ClaseEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/clase-equipo.mapper';
import { Injectable } from '@nestjs/common';
import { ClaseEquipoOrm } from '@orm/inn/equipos/catalogo/clase-equipo.orm';

@Injectable()
export class TypeOrmClaseEquipoRepository extends BaseSource implements ClaseEquipoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(ClaseEquipoOrm) : this.conn.getRepository(ClaseEquipoOrm);
  }

  private relations(): string[] {
    return ['tipoActivo'];
  }

  async save(domain: ClaseEquipo): Promise<ClaseEquipo> {
    const orm = ClaseEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return ClaseEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<ClaseEquipo | null> {
    const orm = await this.repository.findOne({ where: { id }, relations: ['tipoActivo'] });
    return orm ? ClaseEquipoMapper.toDomain(orm) : null;
  }

  async findAll(tipoActivoId: number): Promise<ClaseEquipoRead[]> {
    const orms = await this.repository.find({
      where: { tipoActivo: { id: tipoActivoId } },
      relations: this.relations(),
    });
    return ClaseEquipoMapper.toViewList(orms);
  }

  async findByCodigo(codigo: string): Promise<ClaseEquipo | null> {
    const orm = await this.repository.findOne({ where: { codigo }, relations: ['tipoActivo'] });
    return orm ? ClaseEquipoMapper.toDomain(orm) : null;
  }

  async update(domain: ClaseEquipo): Promise<ClaseEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[ClaseEquipoRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      relations: ['tipoActivo'],
      skip: (page - 1) * limit,
      take: limit,
      order: { nombre: 'ASC' },
    });
    return [ClaseEquipoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<ClaseEquipoRead | null> {
    const orm = await this.repository.findOne({
      where: { id: id },
      relations: this.relations(),
    });
    return orm ? ClaseEquipoMapper.toView(orm) : null;
  }
}
