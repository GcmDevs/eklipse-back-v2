import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { ResourceNotFoundError } from '@common/domain/errors';
import { GCM_CONTEXTS } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import {
  CONSECUTIVO_REPOSITORY,
  ConsecutivoRepository,
} from '../repositories/consecutivos.repository';

@Injectable()
export class ConsecutivoService {
  constructor(
    @Inject(CONSECUTIVO_REPOSITORY)
    private readonly consecutivoRepository: ConsecutivoRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  public async generate(codigo: string): Promise<string> {
    const consecutivo = await this.txManager.transactionalOn(
      switchConn(GCM_CONTEXTS.EKLIPSE),
      () => this.consecutivoRepository.incrementAndGet(codigo)
    );

    if (!consecutivo) {
      throw new ResourceNotFoundError(`Consecutivo no encontrado: ${codigo}`);
    }

    const year = new Date().getFullYear();
    const numero = consecutivo.ultimoValor.toString().padStart(consecutivo.longitud, '0');

    return [consecutivo.prefijo, year, numero].join(consecutivo.separador);
  }
}
