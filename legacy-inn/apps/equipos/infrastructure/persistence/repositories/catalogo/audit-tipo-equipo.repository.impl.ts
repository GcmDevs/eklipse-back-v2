import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { AuditTipoEquipo } from '@equipos/domain/entities/catalogo/audit-tipo-equipo.entity';
import { AuditTipoEquipoRead } from '@equipos/domain/read';
import { AuditTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/audit-tipo-equipo.repository';
import { AuditTipoEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/audit-tipo-equipo.mapper';
import { Injectable } from '@nestjs/common';
import { AuditTipoEquipoOrm } from '@orm/inn/equipos/catalogo/audit-tipo-equipo.orm';

@Injectable()
export class TypeOrmAuditTipoEquipoRepository
  extends BaseSource
  implements AuditTipoEquipoRepository
{
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr
      ? qr.manager.getRepository(AuditTipoEquipoOrm)
      : this.conn.getRepository(AuditTipoEquipoOrm);
  }

  async save(audit: AuditTipoEquipo): Promise<void> {
    const orm = AuditTipoEquipoMapper.toOrm(audit);
    const saved = await this.repository.save(orm);
    audit.assingIdPersistido(saved.id);
  }

  async findByTipoEquipoId(tipoEquipoId: number): Promise<AuditTipoEquipoRead[]> {
    const orms = await this.repository.find({
      where: { tipoEquipoId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return AuditTipoEquipoMapper.toViewList(orms);
  }
}
