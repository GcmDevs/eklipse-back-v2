import { TanqueoIntento } from '../entities';

export interface TanqueoIntentoRepository {
  save(intento: TanqueoIntento): Promise<TanqueoIntento>;
  findById(id: number): Promise<TanqueoIntento | null>;
  findPendientes(page: number, limit: number): Promise<[TanqueoIntento[], number]>;
  deleteAllPendientes(): Promise<number>;
}
