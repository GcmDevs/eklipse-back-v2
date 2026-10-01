import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ServicioOrm } from '@orm/gcn';

@Injectable()
export class ServicioByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string) {
    const conn = this.dynamicConn(this.auth.context);

    const serviciosRp = conn.getRepository(ServicioOrm);

    const servicios = await serviciosRp.find({
      where: { nombre: Like(`%${pattern}%`) },
      take: 5,
    });

    return servicios;
  }
}
