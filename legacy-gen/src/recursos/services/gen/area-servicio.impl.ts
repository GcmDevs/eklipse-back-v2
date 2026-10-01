import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { dataToEntidadBasicaRes } from '@common/presentation/factories';
import { EntidadBasicaRes } from '@common/application/responses';
import { AreaServicioOrm } from '@orm/gen';

@Injectable()
export class AreaServicioImpl extends BaseSource {
  public async fetchByPattern(pattern: string): Promise<EntidadBasicaRes[]> {
    try {
      const repository = this.conn.getRepository(AreaServicioOrm);

      const result = await repository.find({
        where: pattern
          ? [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }]
          : undefined,
        take: pattern ? 5 : undefined,
      });

      return result.map(r => dataToEntidadBasicaRes(r));
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
