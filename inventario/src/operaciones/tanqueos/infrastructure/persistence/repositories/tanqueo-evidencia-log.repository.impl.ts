import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoEvidenciaLog } from '@inn/operaciones/tanqueos/domain/entities';
import { TanqueoEvidenciaLogRepository } from '@inn/operaciones/tanqueos/domain/repositories';
import { TanqueoEvidenciaLogMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers';
import { TanqueoEvidenciaLogOrm } from '../orm';

export class TypeOrmTanqueoEvidenciaLogRepository
  extends BaseSource
  implements TanqueoEvidenciaLogRepository
{
  private get repository() {
    return resolveRepository(this.conn, TanqueoEvidenciaLogOrm);
  }

  async save(log: TanqueoEvidenciaLog): Promise<TanqueoEvidenciaLog> {
    const saved = await this.repository.save(TanqueoEvidenciaLogMapper.toOrm(log));
    return TanqueoEvidenciaLog.rebuild(
      saved.id,
      saved.tanqueo?.id ?? log.getTanqueoId?.getValor ?? null,
      saved.abastecimiento?.id ?? log.getAbastecimientoId?.getValor ?? null,
      saved.tipoEvidencia,
      saved.accion,
      saved.mediaAnteriorId ?? null,
      saved.mediaNuevoId ?? null,
      saved.tipoDestino ?? null,
      saved.motivo ?? null,
      log.getUsuarioId.getValor,
      saved.createdAt
    );
  }

  async findByTanqueoId(tanqueoId: number): Promise<TanqueoEvidenciaLog[]> {
    const orms = await this.repository.find({
      where: { tanqueo: { id: tanqueoId } },
      relations: ['usuario', 'abastecimiento'],
      order: { createdAt: 'DESC' },
    });
    return orms.map(orm =>
      TanqueoEvidenciaLog.rebuild(
        orm.id,
        tanqueoId,
        orm.abastecimiento?.id ?? null,
        orm.tipoEvidencia,
        orm.accion,
        orm.mediaAnteriorId ?? null,
        orm.mediaNuevoId ?? null,
        orm.tipoDestino ?? null,
        orm.motivo ?? null,
        orm.usuario?.id ?? 0,
        orm.createdAt
      )
    );
  }
}
