import { BaseSource } from '@common/infrastructure/services';
import { CrearDominioItemDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DominioItemOrm, DominioOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class CrearDominioImpl extends BaseSource {
  public async createDominioItem(dominioId: number, body: CrearDominioItemDto) {
    const domainRp = this.conn.getRepository(DominioOrm);
    const itemRp = this.conn.getRepository(DominioItemOrm);

    const domain = await domainRp.findOne({
      where: { id: dominioId },
    });

    if (!domain) throw new NotFoundException('Dominio no encontrado');

    const items = await itemRp.find();

    const orden = items.length;

    const item = itemRp.create({
      dominioId: dominioId,
      titulo: body.titulo.trim(),
      subTitulo: body.subTitulo?.trim() ?? null,
      puntos: body.puntos,
      orden: orden + 1,
      isActive: true,
      createdAt: new Date(),
    });

    const data = await itemRp.save(item);

    return data;
  }
}
