import { Injectable } from '@nestjs/common';
import { CentroOrm, CommonCentroOrm } from './orm';
import { getCodeAuthorities } from '@inn/old/common/infrastructure/services';
import { BaseSource, switchConn } from '@common/infrastructure/services';
import { GCM_CONTEXTS } from '@common/domain/types';

@Injectable()
export class ConfigService extends BaseSource {
  public async fetchCentros() {
    const centrosRp = this.conn.getRepository(CentroOrm);
    const centros = await centrosRp.find();
    return centros;
  }

  public async fetchAllCentros() {
    const conn = switchConn(GCM_CONTEXTS.EKLIPSE);
    const centrosRp = conn.getRepository(CommonCentroOrm);
    const centros = await centrosRp.find();
    return centros;
  }

  public async fetchMyAuthorities(): Promise<string[]> {
    const myAuthorities = await getCodeAuthorities(this.auth.id, this.auth.context.getCode());
    return myAuthorities;
  }
}
