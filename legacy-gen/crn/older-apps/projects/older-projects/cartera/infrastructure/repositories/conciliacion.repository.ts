import { Injectable } from '@nestjs/common';
import { ConciliacionRepository } from '@crn/rft/cartera/domain/repositories';
import { ConciliacionModel } from '@crn/rft/cartera/application/models';
import { ConciliacionResponse } from '../data-transfers';
import { dataToConciliacionModel } from '../factories';
import { fetchConciliacionesQuery } from '../queries';
import { ConciliacionOrm } from '../orm';
import { BaseSource } from '@crn/old/common/infrastructure/bases';

@Injectable()
export class ConciliacionSource extends BaseSource implements ConciliacionRepository {
  public async fetch(inicio: Date, final: Date): Promise<ConciliacionModel[]> {
    const response: ConciliacionResponse[] = await this.conn.query(fetchConciliacionesQuery(), [
      inicio.toISOString().split('T')[0],
      final.toISOString().split('T')[0],
    ]);

    return response.map(_ => dataToConciliacionModel(_));
  }

  public async create(): Promise<ConciliacionOrm> {
    throw new Error('Method not implemented.');
  }
}
