import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { DominioOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ObtenerDominiosImpl extends BaseSource {
  public async getDominios(showActiveItemsOnly = true) {
    const domainRp = this.conn.getRepository(DominioOrm);

    const query = domainRp.createQueryBuilder('dominio');

    if (showActiveItemsOnly) {
      query.leftJoinAndSelect('dominio.items', 'item', 'item.isActive = :isActive', {
        isActive: true,
      });
    } else {
      query.leftJoinAndSelect('dominio.items', 'item');
    }

    const data = await query
      .orderBy('dominio.id', 'ASC')
      .addOrderBy('item.orden', 'ASC')
      .addOrderBy('item.id', 'ASC')
      .getMany();

    return data;
  }
}
