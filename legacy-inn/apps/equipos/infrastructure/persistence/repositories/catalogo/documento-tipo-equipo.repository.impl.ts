import { applyActivoStatusToQb, TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { DocumentoTipoEquipo } from '@equipos/domain/entities/catalogo/documento-tipo-equipo.entity';
import { DocumentoTipoEquipoRead } from '@equipos/domain/read';
import { DocumentoTipoEquipoRepository } from '@equipos/domain/repositories/catalogo/documento-tipo-equipo.repository';
import { DocumentoTipoEquipoMapper } from '@equipos/infrastructure/mappers/catalogo/documento-tipo-equipo.mapper';
import { DocumentoTipoEquipoOrm } from '@orm/inn/equipos/catalogo/documento-tipo-equipo.orm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmDocumentoTipoEquipoRepository extends BaseSource implements DocumentoTipoEquipoRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(DocumentoTipoEquipoOrm) : this.conn.getRepository(DocumentoTipoEquipoOrm);
  }

  private alias: string = 'docTipEqp';
  private qbBase(alias = this.alias) {
    return this.repository
      .createQueryBuilder(alias)
      .leftJoinAndSelect(`${alias}.tipoDocumento`, 'tipDoc')
      .leftJoinAndSelect(`${alias}.archivo`, 'archivo');
  }

  async save(domain: DocumentoTipoEquipo): Promise<DocumentoTipoEquipo> {
    const orm = DocumentoTipoEquipoMapper.toOrm(domain);
    const saved = await this.repository.save(orm);
    return DocumentoTipoEquipoMapper.toDomain(saved);
  }

  async findById(id: number): Promise<DocumentoTipoEquipo | null> {
    const orm = await this.repository.findOne({
      where: { id },
      relations: ['tipoDocumento', 'archivo', 'compra'],
    });
    return orm ? DocumentoTipoEquipoMapper.toDomain(orm) : null;
  }

  async findByTipoEquipoId(tipoEquipoId: number): Promise<DocumentoTipoEquipoRead[]> {
    const qb = this.qbBase()
      .where('docTipEqp.tipoEquipo = :tipoEquipoId', { tipoEquipoId })
      .orderBy('docTipEqp.id', 'ASC');
    applyActivoStatusToQb(qb, 'docTipEqp.activo');
    const orms = await qb.getMany();
    return DocumentoTipoEquipoMapper.toViewList(orms);
  }

  async findByCompraId(compraId: number): Promise<DocumentoTipoEquipoRead[]> {
    const qb = this.qbBase()
      .where('docTipEqp.compra = :compraId', { compraId })
      .orderBy('docTipEqp.id', 'ASC');
    applyActivoStatusToQb(qb, 'docTipEqp.activo');
    const orms = await qb.getMany();
    return DocumentoTipoEquipoMapper.toViewList(orms);
  }

  async update(domain: DocumentoTipoEquipo): Promise<DocumentoTipoEquipo> {
    return this.save(domain);
  }

  async exists(id: number): Promise<boolean> {
    return this.repository.exists({ where: { id } });
  }

  async findAllView(page: number, limit: number): Promise<[DocumentoTipoEquipoRead[], number]> {
    const qb = this.qbBase()
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('docTipEqp.id', 'ASC');
    applyActivoStatusToQb(qb, 'docTipEqp.activo');
    const [orms, count] = await qb.getManyAndCount();
    return [DocumentoTipoEquipoMapper.toViewList(orms), count];
  }

  async delete(id: number): Promise<void> {
    throw Error('method not implemented')
  }

  async findViewById(id: number): Promise<DocumentoTipoEquipoRead | null> {
    const orm = await this.qbBase()
      .leftJoin(`${this.alias}.tipoEquipo`, 'tipEquipo')
      .addSelect(['tipEquipo.id'])
      .where('docTipEqp.id = :id', { id })
      .getOne();

    return orm ? DocumentoTipoEquipoMapper.toView(orm) : null;
  }

  async findAllAndCount(page: number, limit: number): Promise<[DocumentoTipoEquipoRead[], number]> {
    return this.findAllView(page, limit);
  }
}
