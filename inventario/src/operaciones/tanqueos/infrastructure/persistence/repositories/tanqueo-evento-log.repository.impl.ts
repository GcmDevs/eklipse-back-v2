import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { TanqueoEventoLog } from '@inn/operaciones/tanqueos/domain/entities/tanqueo-evento-log.entity';
import { TipoEventoTanqueoLog } from '@inn/operaciones/tanqueos/domain/enums';
import { TanqueoEventoLogRepository } from '@inn/operaciones/tanqueos/domain/repositories/tanqueo-evento-log.repository';
import { TanqueoEventoLogMapper } from '@inn/operaciones/tanqueos/infrastructure/mappers/tanqueo-evento-log.mapper';
import { TanqueoEventoLogOrm } from '../orm/tanqueo-evento-log.orm';

export class TypeOrmTanqueoEventoLogRepository
  extends BaseSource
  implements TanqueoEventoLogRepository
{
  private get repository() {
    return resolveRepository(this.conn, TanqueoEventoLogOrm);
  }

  async save(evento: TanqueoEventoLog): Promise<TanqueoEventoLog> {
    const saved = await this.repository.save(TanqueoEventoLogMapper.toOrm(evento));
    return TanqueoEventoLogMapper.toDomain(saved);
  }

  async existsLimpiezaIntentosInMonth(year: number, month: number): Promise<boolean> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const count = await this.repository
      .createQueryBuilder('e')
      .where('e.tipoEvento = :tipo', { tipo: TipoEventoTanqueoLog.LIMPIEZA_INTENTOS })
      .andWhere('e.createdAt >= :start AND e.createdAt < :end', { start, end })
      .getCount();
    return count > 0;
  }
}
