import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { ActivoFijoOrm } from '../orm/activo-fijo.orm';
import { Like } from 'typeorm';
import { AccesorioOrm } from '../orm';

@Injectable()
export class FindByPatternImpl extends BaseSource {
  public async fetchByPatternDocActivo(pattern: string) {
    const documentosActivoRp = this.conn.getRepository(ActivoFijoOrm);
    const documentosActivo = await documentosActivoRp.find({
      where: { numeroPlaca: Like(`%${pattern.toString()}%`), producto: { grupoId: 6 } },
      relations: ['producto', 'producto.grupo', 'area', 'responsable', 'responsable.dependencia'],
      take: 5,
    });

    return documentosActivo;
  }
  public async fetchByPatternAccesorio(pattern: string) {
    const accesorioRp = this.conn.getRepository(AccesorioOrm);
    const accesorios = await accesorioRp.find({
      where: { nombre: Like(`%${pattern.toString()}%`) },
      take: 5,
    });

    return accesorios;
  }
}
