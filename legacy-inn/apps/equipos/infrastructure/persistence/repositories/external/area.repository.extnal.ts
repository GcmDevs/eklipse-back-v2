import { BaseSource } from "@common/infrastructure/services";
import { AreaServicioOrm } from "@orm/gen";
import { ILike, Repository } from "typeorm";


export class TypeOrmAreaRepository extends BaseSource {
  private readonly repository: Repository<AreaServicioOrm> = this.conn.getRepository(AreaServicioOrm);


  async findById(id: number): Promise<AreaServicioOrm | null> {
    const areaFound = await this.repository.findOne({
      where: { id: id }
    })
    return areaFound ?? null;
  }

  public async findSuggestionsByNombre(
    nombreParcial: string,
    limit: number
  ): Promise<AreaServicioOrm[]> {
    const areasFound = await this.repository.find({
      where: { nombre: ILike(`%${nombreParcial}%`) },
      take: limit,
    });

    return areasFound;
  }


  public async findAllAndCount(skip: number, take: number): Promise<[AreaServicioOrm[], number]> {
    const [areasFound, count] = await this.repository.findAndCount({
      take: take,
      skip: (skip! - 1) * take
    });

    return [areasFound, count]
  }


  async update(marca: Partial<AreaServicioOrm>): Promise<AreaServicioOrm> {
    throw new Error("Method not implemented.");
  }

  async delete(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
