import { BaseSource } from "@common/infrastructure/services";
import { ResponsableView } from "@orm/cor";
import { Repository } from "typeorm";

export class TypeOrmResponsableRepository extends BaseSource {
    private readonly repository: Repository<ResponsableView> = this.conn.getRepository(ResponsableView);

    public async findById(id: number): Promise<ResponsableView | null> {
        const responsableFound = await this.repository.findOne({
            where: { responsableId: id },
        });
        return responsableFound ?? null;
    }

  async findAll(
    take: number,
    search?: string,
  ): Promise<ResponsableView[]> {
    const qb = this.repository.createQueryBuilder('resp');

    if (search?.trim()) {
      qb.andWhere('resp.responsableNombre LIKE :search', {
        search: `%${search.trim()}%`,
      });
    }
    const responsablesFounds = await qb
      .take(take)
      .orderBy('resp.responsableNombre', 'ASC')
      .getMany();

    return responsablesFounds
  }
}
