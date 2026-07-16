import { BaseSource } from '@common/infrastructure/services';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DominioItemOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ToggleDominioItemActivoImpl extends BaseSource {
  public async toggleDominioItemActivo(id: number) {
    const itemRp = this.conn.getRepository(DominioItemOrm);
    const item = await itemRp.findOne({
      where: { id },
    });

    if (!item) throw new NotFoundException('Item de dominio no encontrado');

    item.isActive = !item.isActive;
    await itemRp.save(item);

    return true;
  }
}
