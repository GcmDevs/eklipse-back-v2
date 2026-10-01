import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { SubclaseEquipo } from '@equipos/domain/entities/catalogo/subclase-equipo.entity';
import { SubclaseEquipoRead } from '@equipos/domain/read';
import { SubclaseEquipoRepository } from '@equipos/domain/repositories/catalogo/subclase-equipo.repository';
import { SubclaseEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/subclase-equipo.mapper';
import { Injectable } from '@nestjs/common';
import { SubclaseEquipoOrm } from '@orm/inn/equipos/catalogo/subclase-equipo.orm';

@Injectable()
export class TypeOrmSubclaseEquipoRepository extends BaseSource implements SubclaseEquipoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(SubclaseEquipoOrm) : this.conn.getRepository(SubclaseEquipoOrm);
  }

  private relations(): string[] {
    return ['clase']
  }

  async save(domain: SubclaseEquipo): Promise<SubclaseEquipo> {
    const orm = SubclaseEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return SubclaseEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<SubclaseEquipo | null> {
    const orm = await this.repository.findOne({ where: { id }, relations: ['clase'] });
    return orm ? SubclaseEquipoMapper.toDomain(orm) : null;
  }

  async findAll(claseId: number): Promise<SubclaseEquipoRead[]> {
    const orms = await this.repository.find({
      where: { clase: { id: claseId } },
      order: { nombre: 'DESC' },
      relations: this.relations()
    })
    return SubclaseEquipoMapper.toViewList(orms);
  }

  async findByCodigo(codigo: string): Promise<SubclaseEquipo | null> {
    const orm = await this.repository.findOne({ where: { codigo }, relations: ['clase'] });
    return orm ? SubclaseEquipoMapper.toDomain(orm) : null;
  }

  async update(domain: SubclaseEquipo): Promise<SubclaseEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[SubclaseEquipoRead[], number]> {
    const [orms, count] = await this.repository.findAndCount({
      relations: ['clase'],
      skip: (page - 1) * limit, take: limit,
      order: { nombre: 'ASC' },
    });
    return [SubclaseEquipoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findViewById(id: number): Promise<SubclaseEquipoRead | null> {
    const orm = await this.repository.findOne({
      where: { id: id },
      relations: this.relations()
    })
    return orm ? SubclaseEquipoMapper.toView(orm) : null;
  }
}