import { BaseSource } from '@common/infrastructure/services';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EstanciasProlongadasOrm } from '@orm/hpn/estancias-prolongadas';

@Injectable()
export class EstanciasProlongadasActivasImpl extends BaseSource {
  public async getEstanciasProlongadasActivas() {
    const estanciasProlongadasRp = this.conn.getRepository(EstanciasProlongadasOrm);
    const data = await estanciasProlongadasRp.find({
      where: { estado: true },
      order: { createdAt: 'DESC' },
      relations: ['preguntas', 'acciones', 'seguimientos'],
    });
    if (!data.length) {
      throw new NotFoundException('No se encontraron estancias activas');
    }

    return data;
  }
}
