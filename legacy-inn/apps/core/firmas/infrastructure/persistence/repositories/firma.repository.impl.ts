import { TypeOrmTransactionContext } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { FirmaRepository } from '@core/firmas/application/repositories';
import { Injectable } from '@nestjs/common';
import { FirmaOrm, TipoFirmante } from '@orm/cor';

@Injectable()
export class TypeOrmFirmaRepository extends BaseSource implements FirmaRepository {
  private get repository() {
    const qr = TypeOrmTransactionContext.getQueryRunner();
    return qr ? qr.manager.getRepository(FirmaOrm) : this.conn.getRepository(FirmaOrm);
  }

  private get relations() {
    return {
      archivoFirma: true,
      usuario: true,
      tercero: true,
    };
  }

  async save(data: Partial<FirmaOrm>): Promise<FirmaOrm> {
    const saved = await this.repository.save(this.repository.create(data));
    return this.findById(saved.id);
  }

  async update(id: number, data: Partial<FirmaOrm>): Promise<FirmaOrm> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async findById(id: number): Promise<FirmaOrm | null> {
    return this.repository.findOne({
      where: { id },
      relations: this.relations,
    });
  }

  async findByArchivoId(archivoId: number): Promise<FirmaOrm[]> {
    return this.repository
      .createQueryBuilder('firma')
      .leftJoinAndSelect('firma.archivoFirma', 'archivoFirma')
      .leftJoinAndSelect('firma.usuario', 'usuario')
      .leftJoinAndSelect('firma.tercero', 'tercero')
      .where('archivo.id = :archivoId', { archivoId })
      .orderBy('firma.fechaFirma', 'DESC')
      .getMany();
  }

  async findByFirmante(firmanteId: number, tipoFirmante: TipoFirmante): Promise<FirmaOrm> {
    const qb = this.repository
      .createQueryBuilder('firma')
      .leftJoinAndSelect('firma.archivoFirma', 'archivoFirma')
      .leftJoinAndSelect('firma.usuario', 'usuario')
      .leftJoinAndSelect('firma.tercero', 'tercero');
    if (tipoFirmante === TipoFirmante.USUARIO) {
      qb.where('usuario.id = :id', { id: firmanteId });
    }
    if (tipoFirmante === TipoFirmante.TERCERO) {
      qb.where('tercero.id = :id', { id: firmanteId });
    }
    return qb.getOne();
  }
}
