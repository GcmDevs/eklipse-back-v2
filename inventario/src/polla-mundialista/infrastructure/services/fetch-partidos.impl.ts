import { BaseSource } from '@common/infrastructure/services';
import { PollaMundialistaOrm } from '@inn/orm/inn/polla-mundialista';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FetchPartidosImpl extends BaseSource {
  async execute(): Promise<PollaMundialistaOrm[]> {
    const partidoRp = this.ekConn.getRepository(PollaMundialistaOrm);

    return partidoRp.find({
      order: { fecha: 'DESC' },
    });
  }
}
