import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { ConsecutivoRepository } from '@core/consecutivos/application';
import { Injectable } from '@nestjs/common';
import { ConsecutivoOrm } from '@orm/cor';

@Injectable()
export class TypeOrmConsecutivoRepository extends BaseSource implements ConsecutivoRepository {
  private get repository() {
    return this.ekConn.getRepository(ConsecutivoOrm);
  }

  public async save(consecutivo: Partial<ConsecutivoOrm>): Promise<ConsecutivoOrm> {
    return await this.repository.save(this.repository.create(consecutivo));
  }

  public async findByCodigo(codigo: string): Promise<ConsecutivoOrm | null> {
    return await this.repository
      .createQueryBuilder('consec')
      .where('consec.codigo = :codigo', { codigo })
      .getOne();
  }

  public async incrementAndGet(codigo: string): Promise<ConsecutivoOrm | null> {
    const repository = resolveRepository(this.ekConn, ConsecutivoOrm);

    const consecutivo = await repository
      .createQueryBuilder('consec')
      .setLock('pessimistic_write')
      .where('consec.codigo = :codigo', { codigo })
      .getOne();

    if (!consecutivo) {
      return null;
    }

    consecutivo.ultimoValor = Number(consecutivo.ultimoValor) + 1;
    await repository.save(consecutivo);

    return consecutivo;
  }
}
