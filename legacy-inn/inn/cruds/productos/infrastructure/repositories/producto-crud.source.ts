import { Like } from 'typeorm';
import { BaseSource } from '@common/infrastructure/services';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductoOrm } from '@inn/orm/inn';

@Injectable()
export class ProductoCrudSource extends BaseSource {
  public async fetch(pattern: string, basicData: boolean): Promise<ProductoOrm[]> {
    try {
      const entidadRp = this.conn.getRepository(ProductoOrm);

      const entidades = await entidadRp.find({
        where: pattern
          ? [
              { codigo: Like(`%${pattern}%`), isBloqueado: false },
              { descripcion: Like(`%${pattern}%`), isBloqueado: false },
            ]
          : { isBloqueado: false },
        select: basicData
          ? {
              id: true,
              codigo: true,
              descripcion: true,
            }
          : undefined,
        take: pattern ? 5 : undefined,
        relations: !basicData ? ['agrupamiento', 'grupo'] : undefined,
      });

      entidades.map(e => {
        e.nombre = e.descripcion;
        delete e.descripcion;
        delete e.isBloqueado;
        if (!basicData) {
          delete e.agrupamientoId;
          delete e.grupoId;
          e.setTypes(true);
        }
      });

      return entidades;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
