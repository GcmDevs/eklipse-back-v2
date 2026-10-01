import { BaseSource } from '@sln/old/common/infrastructure/bases';
import { Injectable } from '@nestjs/common';
import { CommonCentroOrm } from './orm';
import { getCodeAuthorities } from '@sln/old/common/infrastructure/services';
import { switchConn } from '@common/infrastructure/services';
import { GCM_CONTEXTS } from '@common/domain/types';
import { CentroOrm } from '@sln/orm/adn';

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
    const myAuthorities = await getCodeAuthorities(this.auth.id, this.auth.context);
    return myAuthorities;
  }
}
