import { Like } from 'typeorm';
import { AlmacenProductoOrm } from '@inn/orm/inn';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class AlmacenCrudSource extends BaseSource {
  public async fetch(pattern?: string, basicData?: boolean): Promise<AlmacenProductoOrm[]> {
    try {
      const entidadRp = this.conn.getRepository(AlmacenProductoOrm);

      const entidades = await entidadRp.find({
        where: pattern
          ? [{ codigo: Like(`%${pattern}%`) }, { nombre: Like(`%${pattern}%`) }]
          : undefined,
        select: basicData
          ? {
              id: true,
              codigo: true,
              nombre: true,
            }
          : undefined,
        take: pattern ? 5 : undefined,
        relations: !basicData ? ['estantes'] : undefined,
      });

      if (!basicData) {
        entidades.map(e => {
          e.setTypes(true);
          e.estantes.map(s => {
            s.setTypes(true);
            delete s.almacenId;
          });
        });
      }

      return entidades;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
