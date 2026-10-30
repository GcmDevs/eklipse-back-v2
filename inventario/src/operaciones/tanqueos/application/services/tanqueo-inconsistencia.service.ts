import { TRANSACTION_MANAGER, TransactionManager } from '@common/application/services';
import { BadInputError, ResourceNotFoundError } from '@common/domain/errors';
import { getUser } from '@common/infrastructure/services';
import { TanqueoInconsistenciaRead } from '@inn/operaciones/tanqueos/domain/reads';
import {
  TANQUEO_INCONSISTENCIA_REPOSITORY,
  TanqueoInconsistenciaRepository,
} from '@inn/operaciones/tanqueos/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';
import {
  ResultadoInconsistencia,
  ResultadoInconsistenciaResolucion,
} from '@inn/operaciones/tanqueos/domain/enums/estados.enum';

@Injectable()
export class TanqueoInconsistenciaService {
  constructor(
    @Inject(TANQUEO_INCONSISTENCIA_REPOSITORY)
    private readonly inconsistenciaRepository: TanqueoInconsistenciaRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly txManager: TransactionManager
  ) {}

  async resolve(
    tanqueoId: number,
    inconsistenciaId: number,
    contactoRealizado: boolean,
    notaResolucion?: string,
    notaContacto?: string,
    resultado?: ResultadoInconsistenciaResolucion
  ): Promise<TanqueoInconsistenciaRead> {
    const inconsistencia = await this.inconsistenciaRepository.findById(inconsistenciaId);
    if (!inconsistencia) {
      throw new ResourceNotFoundError(`Inconsistencia con id: ${inconsistenciaId} no encontrada`);
    }

    if (inconsistencia.getTanqueoId.getValor !== tanqueoId) {
      throw new BadInputError('La inconsistencia no pertenece al tanqueo indicado');
    }

    if ((resultado as string) === ResultadoInconsistencia.CORREGIDA) {
      throw new BadInputError(
        'CORREGIDA no es un resultado válido en resolver; las alertas corregidas se cierran automáticamente al corregir el tanqueo'
      );
    }

    const usuario = getUser();
    const resultadoFinal =
      resultado === ResultadoInconsistenciaResolucion.FALSO_POSITIVO
        ? ResultadoInconsistencia.FALSO_POSITIVO
        : ResultadoInconsistencia.JUSTIFICADA;
    inconsistencia.close({
      resueltoPorUsuarioId: usuario.id,
      resultado: resultadoFinal,
      notaResolucion,
      notaContacto,
      contactoRealizado,
    });

    await this.txManager.transactional(async () => {
      await this.inconsistenciaRepository.save(inconsistencia);
    });

    const found = await this.inconsistenciaRepository.findViewById(inconsistenciaId);
    if (!found) {
      throw new BadInputError('No fue posible recuperar la inconsistencia resuelta');
    }
    return found;
  }
}
