import { EntidadTipoAnexo } from '@common/domain/enums';
import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { Anexo } from '@core/media/domain/entities';
import { AnexoRead } from '@core/media/domain/read/media.read';
import { AnexoRepository } from '@core/media/domain/repositories';
import { AnexoGroupKey, AnexoLookupItem, makeAnexoGroupKey } from '@core/media/domain/types';
import { AnexoOrm } from '@orm/cor';
import { AnexoMapper } from '../../mappers';

export class TypeOrmAnexoRepository extends BaseSource implements AnexoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    if (qr) {
      return qr.manager.getRepository(AnexoOrm);
    }
    return this.conn.getRepository(AnexoOrm);
  }

  async saveMany(anexos: Anexo[]): Promise<void> {
    if (!anexos.length) return;
    const orms = anexos.map(AnexoMapper.toOrm);
    await this.repository.save(orms);
  }

  async countByEntidad(tipo: EntidadTipoAnexo, entidadId: number): Promise<number> {
    return this.repository.count({
      where: { entidadTipo: tipo, entidadId },
    });
  }

  async findGroupedByEntidad(items: AnexoLookupItem[]): Promise<Map<AnexoGroupKey, AnexoRead[]>> {
    const result = new Map<AnexoGroupKey, AnexoRead[]>();
    if (!items.length) return result;

    const byTipo = new Map<EntidadTipoAnexo, number[]>();
    for (const item of items) {
      const existing = byTipo.get(item.entidadTipo) ?? [];
      existing.push(item.entidadId);
      byTipo.set(item.entidadTipo, existing);
    }

    const qb = this.repository
      .createQueryBuilder('a')
      .orderBy('a.orden', 'ASC')
      .leftJoinAndSelect('a.archivo', 'archivo');

    let first = true;
    for (const [tipo, ids] of byTipo) {
      const method = first ? 'where' : 'orWhere';
      qb[method]('(a.entidadTipo = :tipo_' + tipo + ' AND a.entidadId IN (:...ids_' + tipo + '))', {
        [`tipo_${tipo}`]: tipo,
        [`ids_${tipo}`]: ids,
      });
      first = false;
    }

    const rows = await qb.getMany();
    for (const row of rows) {
      const key = makeAnexoGroupKey(row.entidadTipo, row.entidadId);
      const group = result.get(key) ?? [];
      group.push(AnexoMapper.toView(row));
      result.set(key, group);
    }

    return result;
  }
}
