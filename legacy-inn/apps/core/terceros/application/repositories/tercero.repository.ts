import { TerceroOrm } from '@orm/cor';
import { RolTercero } from '@orm/cor/rol-tercero.orm';

export interface TerceroRepository {
  save(data: any): Promise<TerceroOrm>;
  findAll(limit?: number, search?: string, rol?: RolTercero): Promise<TerceroOrm[]>;
  findById(id: number): Promise<TerceroOrm | null>;
  findByIdAndRol(id: number, rol: RolTercero): Promise<TerceroOrm | null>;
}
