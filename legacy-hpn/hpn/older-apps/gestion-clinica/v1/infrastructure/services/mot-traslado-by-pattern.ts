import { Like } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MotivoTrasladoOrm } from '../orm';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class motTrasladoByPatternService extends BaseSource {
  public async fetchByPattern(pattern: string) {
    const conn = this.dynamicConn(this.auth.context);

    const motivoTrasladoRp = conn.getRepository(MotivoTrasladoOrm);

    const motivostraslados = await motivoTrasladoRp.find({
      where: { nombre: Like(`%${pattern}%`) },
      take: 5,
    });

    return motivostraslados;
  }
}
