import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { DepartamentoOrm } from '../../../../orm/general';

@Injectable()
export class DepartamentoByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string) {
    const conn = this.dynamicConn(this.auth.context);

    const deptoRp = conn.getRepository(DepartamentoOrm);

    const deptos = await deptoRp.find({
      where: { nombre: Like(`%${pattern}%`) },
      take: 5,
    });

    return deptos;
  }
}
