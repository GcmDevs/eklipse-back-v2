import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { EntidadOrm } from '@orm/gcn';

@Injectable()
export class EntidadByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string) {
    const conn = this.dynamicConn(this.auth.context);

    const entidadRp = conn.getRepository(EntidadOrm);

    const entidades = await entidadRp.find({
      where: { nombre: Like(`%${pattern}%`) },
      relations: [
        'tercero',
        'tercero.municipio',
        'tercero.direccion',
        'tercero.municipio.departamento',
      ],
      take: 5,
    });

    return entidades;
  }
}
