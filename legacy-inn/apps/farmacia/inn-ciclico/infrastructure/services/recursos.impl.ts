import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { AlmacenOrm } from '@orm/inn/productos';
import { Like } from 'typeorm';
import { almacenOrmToAlmacenResFactory } from '../factories';

@Injectable()
export class RecursosImpl extends BaseSource {
  async fetchAlmacenes(pattern: string) {
    try {
      const repository = this.conn.getRepository(AlmacenOrm);

      const result = await repository.find({
        where: pattern
          ? [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }]
          : undefined,
        relations: ['estantes'],
        take: pattern ? 5 : undefined,
      });

      return result.map(r => almacenOrmToAlmacenResFactory(r));
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
