import { BaseSource } from '@common/infrastructure/services';
import { Modelo } from '@equipos/domain/entities';
import { ModeloRead } from '@equipos/domain/read';
import { ModeloRepository } from '@equipos/domain/repositories';
import { ModeloMapper } from '@equipos/infrastructure/mappers';
import { ModeloOrm } from '@orm/inn/equipos';

export class TypeOrmModeloRepository
  extends BaseSource
  implements ModeloRepository {
  private readonly repository = this.conn.getRepository(ModeloOrm);

  private qbBase(alias = 'modelo') {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.marca`, 'marca')
      .select([
        `${alias}.id`,
        `${alias}.nombre`,
        'marca.id',
        'marca.nombre',
      ]);
  }


  async findViewById(id: number): Promise<ModeloRead> {
    const modeloFound = await this.qbBase()
      .where('modelo.id = :id', { id })
      .getOne();

    return modeloFound ? ModeloMapper.toView(modeloFound) : null;
  }

  async findById(id: number): Promise<Modelo | null> {
    const modeloFound = await this.qbBase()
      .where('modelo.id = :id', { id })
      .getOne();

    return modeloFound ? ModeloMapper.toDomain(modeloFound) : null;
  }

  async findAllByMarca(
    marcaId: number,
    search?: string,
  ): Promise<ModeloRead[]> {
    const qb = this.qbBase().where('marca.id = :marcaId', { marcaId });

    if (search?.trim()) {
      qb.andWhere('modelo.nombre LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    const modelosFound = await qb.getMany();
    return modelosFound.map(ModeloMapper.toView);
  }

  async existByNombre(nombre: string): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('modelo')
      .where('modelo.nombre = :nombre', { nombre })
      .getCount();

    return count > 0;
  }

  async save(modelo: Modelo): Promise<Modelo> {
    const modeloOrm = ModeloMapper.toOrm(modelo);
    const saved = await this.repository.save(modeloOrm);
    return ModeloMapper.toDomain(saved);
  }

  async update(modelo: Partial<Modelo>): Promise<Modelo> {
    throw new Error('Method not implemented.');
  }

  async delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  exists(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  findAllView(page: number, limit: number): Promise<[ModeloRead[], number]> {
    throw new Error('Method not implemented.');
  }

  async findModeloByLegacyNombre(
    nombreLegacy: string,
  ): Promise<Modelo | null> {
    const raw = await this.repository.query(
      'EXEC SP_FIND_NEW_MODELO_BY_LEGACY_NAME @0',
      [nombreLegacy],
    );

    const modeloFound = raw[0];

    return modeloFound
      ? ModeloMapper.fromLegacySp(modeloFound)
      : null;
  }
}
