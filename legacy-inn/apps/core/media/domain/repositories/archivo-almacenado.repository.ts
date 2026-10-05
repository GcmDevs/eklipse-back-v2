import { ArchivoAlmacenado } from '../entities/archivo-almacenado.entity';

export interface ArchivoAlmacenadoRepository {
  save(archivoAlmdo: ArchivoAlmacenado): Promise<ArchivoAlmacenado>;
  findById(id: number): Promise<ArchivoAlmacenado | null>;
  findByIds(ids: number[]): Promise<ArchivoAlmacenado[]>;
  markAsUsado(archivoAlmdo): Promise<ArchivoAlmacenado>;
  markAsNoUsado(id: number): Promise<void>;
  revertToStaging(id: number, rutaStaging: string): Promise<void>;
  remove(id: number): Promise<void>;
}
