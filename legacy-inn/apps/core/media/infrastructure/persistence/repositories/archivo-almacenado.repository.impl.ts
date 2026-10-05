import { resolveRepository } from '@common/infrastructure/persistence/transactional';
import { BaseSource } from '@common/infrastructure/services';
import { ArchivoAlmacenado } from '@core/media/domain/entities';
import { ArchivoAlmacenadoRepository } from '@core/media/domain/repositories';
import { Injectable } from '@nestjs/common';
import { ArchivoAlmacenadoOrm } from '@orm/cor';
import { In } from 'typeorm';
import { ArchivoAlmacenadoMapper } from '../../mappers/archivo-almacenado.mapper';

@Injectable()
export class TypeOrmArchivoAlmdoRepository
  extends BaseSource
  implements ArchivoAlmacenadoRepository
{
  private get repository() {
    return resolveRepository(this.conn, ArchivoAlmacenadoOrm);
  }

  public async save(archivoAlmdo: ArchivoAlmacenado): Promise<ArchivoAlmacenado> {
    const archivoAlmdoOrm = ArchivoAlmacenadoMapper.toOrm(archivoAlmdo);
    const archivoAlmdoSaved = await this.repository.save(archivoAlmdoOrm);
    return ArchivoAlmacenadoMapper.toDomain(archivoAlmdoSaved);
  }

  public async findById(id: number): Promise<ArchivoAlmacenado | null> {
    const archivo = await this.repository.findOne({ where: { id } });
    return archivo ? ArchivoAlmacenadoMapper.toDomain(archivo) : null;
  }

  public async findByIds(ids: number[]): Promise<ArchivoAlmacenado[]> {
    if (!ids || ids.length === 0) return [];

    const archivos = await this.repository.find({
      where: { id: In(ids) },
    });

    return ArchivoAlmacenadoMapper.toDomainList(archivos);
  }

  public async markAsUsado(archivoAlmdo: ArchivoAlmacenado): Promise<ArchivoAlmacenado> {
    const id = archivoAlmdo.getId.getValor;
    const archivoAlmdoOrm = ArchivoAlmacenadoMapper.toUpdateOrm(archivoAlmdo);
    await this.repository.update({ id }, archivoAlmdoOrm);
    return archivoAlmdo;
  }

  public async markAsNoUsado(id: number): Promise<void> {
    await this.repository.update({ id }, { isUsado: false });
  }

  public async revertToStaging(id: number, rutaStaging: string): Promise<void> {
    await this.repository.update(
      { id },
      {
        isUsado: false,
        isTemporal: true,
        rutaArchivo: rutaStaging,
        contexto: null,
        referenciaId: null,
        usuarioCargaId: null,
      }
    );
  }

  public async remove(id: number): Promise<void> {
    await this.repository.delete({ id: id });
  }
}
