import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { MunicipioOrm } from '@orm/gen';

@Injectable()
export class MunicipioByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string, codigoDepto: string) {
    const conn = this.dynamicConn(this.auth.context);

    const municipiosRp = conn.getRepository(MunicipioOrm);

    const municipios = await municipiosRp.find({
      where: { codDepto: codigoDepto, nombre: Like(`%${pattern}%`) },
      take: 5,
    });

    return municipios;
  }
}
