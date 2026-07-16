import { BaseSource } from '@common/infrastructure/services';
import { ActualizarDominioItemDto } from '@hpn/estancias-prolongadas/presentation/dtos';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DominioItemOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class ActualizarDominiosItemImpl extends BaseSource {
  public async actualizarDominioItem(id: number, body: ActualizarDominioItemDto) {
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
}
