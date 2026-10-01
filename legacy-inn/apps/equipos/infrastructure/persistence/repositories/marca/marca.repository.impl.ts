import { BaseSource } from '@common/infrastructure/services';
import { Marca } from '@equipos/domain/entities';
import { MarcaRead } from '@equipos/domain/read';
import { MarcaRepository } from '@equipos/domain/repositories';
import { MarcaMapper } from '@equipos/infrastructure/mappers';
import { MarcaOrm } from '@orm/inn/equipos';
import { Repository } from 'typeorm';

export class TypeOrmMarcaRepository
  extends BaseSource
  implements MarcaRepository {
  private readonly repository: Repository<MarcaOrm> =
    this.conn.getRepository(MarcaOrm);

  private qbBase(alias = 'marca') {
    return this.repository
      .createQueryBuilder(alias)
      .select([
        `${alias}.id`,
        `${alias}.nombre`
      ]);
  }


  async findViewById(id: number): Promise<MarcaRead> {
    const marcaFound = await this.qbBase()
      .where('marca.id = :id', { id })
      .getOne();

    return marcaFound ? MarcaMapper.toView(marcaFound) : null;
  }

  async findById(id: number): Promise<Marca | null> {
    const marcaFound = await this.repository.createQueryBuilder('marca')
      .where('marca.id = :id', { id })
      .getOne();

    return marcaFound ? MarcaMapper.toDomain(marcaFound) : null;
  }

  async findAllAndCount(
    page: number,
    take: number,
    search?: string,
  ): Promise<[MarcaRead[], number]> {
    const qb = this.qbBase();

    if (search?.trim()) {
      qb.andWhere('marca.nombre LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }
    const [marcasFound, count] = await qb
      .skip((page - 1) * take)
      .take(take)
      .orderBy('marca.nombre', 'ASC')
      .getManyAndCount();

    return [MarcaMapper.toViewList(marcasFound), count];
  }

  async save(marca: Marca): Promise<Marca> {
    const marcaOrm = MarcaMapper.toOrm(marca);
    const saved = await this.repository.save(marcaOrm);
    return MarcaMapper.toDomain(saved);
  }

  async existByNombre(nombre: string): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('marca')
      .where('marca.nombre = :nombre', { nombre })
      .getCount();

    return count > 0;
  }

  update(updateEntity: Marca): Promise<Marca> {
    throw new Error('Method not implemented.');
  }

  delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  exists(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  findAllView(page: number, limit: number): Promise<[MarcaRead[], number]> {
    throw new Error('Method not implemented.');
  }

  async findMarcaByLegacyNombre(
    nombreLegacy: string,
  ): Promise<Marca | null> {
    const raw = await this.repository.query(
      'EXEC SP_FIND_NEW_MARCA_BY_LEGACY_NAME @0',
      [nombreLegacy],
    );

    const marcaFound = raw[0];
    return marcaFound
      ? MarcaMapper.fromLegacySp(marcaFound)
      : null;
  }
}
