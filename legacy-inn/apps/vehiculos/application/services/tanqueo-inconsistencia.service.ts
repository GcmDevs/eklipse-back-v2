import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import {
  TanqueoInconsistenciaRead,
  TanqueoInconsistenciasGrupoRead,
} from '@vehiculos/domain/reads';
import {
  TANQUEO_INCONSISTENCIA_REPOSITORY,
  TanqueoInconsistenciaFilters,
  TanqueoInconsistenciaRepository,
} from '@vehiculos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class TanqueoInconsistenciaService {
  constructor(
    @Inject(TANQUEO_INCONSISTENCIA_REPOSITORY)
    private readonly inconsistenciaRepository: TanqueoInconsistenciaRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async getAll(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciaRead[], number]> {
    return this.inconsistenciaRepository.findAllAndCount(page, limit, filters);
  }

  async getAllGrouped(
    page: number,
    limit: number,
    filters?: TanqueoInconsistenciaFilters
  ): Promise<[TanqueoInconsistenciasGrupoRead[], number]> {
    return this.inconsistenciaRepository.findAllGroupedAndCount(page, limit, filters);
  }

  async resolve(
    id: number,
    contactoRealizado: boolean,
    notaResolucion?: string,
    notaContacto?: string
  ): Promise<TanqueoInconsistenciaRead> {
    const inconsistencia = await this.inconsistenciaRepository.findById(id);
    if (!inconsistencia) {
      throw new ResourceNotFoundError(`Inconsistencia con id: ${id} no encontrada`);
    }

    const usuario = getUser();
    inconsistencia.resolve(usuario.id, contactoRealizado, notaResolucion, notaContacto);

    await this.txManager.transactional(async () => {
      await this.inconsistenciaRepository.save(inconsistencia);
    });

    const found = await this.inconsistenciaRepository.findViewById(id);
    if (!found) {
      throw new BadInputError('No fue posible recuperar la inconsistencia resuelta');
    }
    return found;
  }
}
