import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { DominioItemOrm, DominioOrm } from '@orm/hpn/estancia-prolongadas';
import { CreateDominioItemDto, UpdateDomainItemDto } from '../../presentation/dtos';

//79653575
@Injectable()
export class DominiosService extends BaseSource {
  public async getDomains(showActiveItemsOnly = true) {
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

  public async createDominioItem(dominioId: number, body: CreateDominioItemDto) {
    console.log('body', body);

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

  public async updateDomainItem(id: number, body: UpdateDomainItemDto) {
    const itemRp = this.conn.getRepository(DominioItemOrm);
    const item = await itemRp.findOne({
      where: { id },
      relations: ['dominio'],
    });

    if (!item) throw new NotFoundException('Item de dominio no encontrado');

    if (body.title !== undefined) item.titulo = body.title.trim();
    if (body.subTitle !== undefined) item.subTitulo = body.subTitle?.trim() ?? null;
    if (body.points !== undefined) item.puntos = body.points;
    if (body.order !== undefined) item.orden = body.order;

    const data = await itemRp.save(item);

    return {
      message: 'Item de dominio actualizado satisfactoriamente',
      data,
    };
  }

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
