import { BaseSource } from '@common/infrastructure/services';
import { Injectable } from '@nestjs/common';
import { boletaQuirurgicaQuery } from '../queries';
import { mapBoletaQuirurgicaRows } from '@hpn/boleta-quirurgica/application/mappers';
import { throwBoletaQuirurgicaError } from '@hpn/boleta-quirurgica/application/errors';

@Injectable()
export class FetchBoletaQuirurgicaImpl extends BaseSource {
  public async execute(): Promise<any> {
    try {
      const result = await this.conn.query(boletaQuirurgicaQuery());
      return mapBoletaQuirurgicaRows(result);
    } catch (error) {
      throwBoletaQuirurgicaError(error, 'Error fetching boleta quirurgica');
    }
  }
}
