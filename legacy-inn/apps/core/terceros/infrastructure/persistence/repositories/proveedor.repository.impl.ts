import { BaseSource } from '@common/infrastructure/services';
import { ProveedorOrm } from '@orm/gen';
import { Repository } from 'typeorm';

export class TypeOrmProveedorRepository extends BaseSource {
  private readonly repository: Repository<ProveedorOrm> = this.conn.getRepository(ProveedorOrm);

  public async findById(id: number): Promise<ProveedorOrm | null> {
    const proveedorFound = await this.repository.findOne({
      where: { id: id },
    });
    return proveedorFound ?? null;
  }

  async findAll(take: number, search?: string): Promise<ProveedorOrm[]> {
    const qb = this.repository.createQueryBuilder('prov');

    if (search?.trim()) {
      qb.andWhere('prov.nombre LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }
    const proveedoresFounds = await qb.take(take).orderBy('prov.nombre', 'ASC').getMany();

    return proveedoresFounds;
  }
}
