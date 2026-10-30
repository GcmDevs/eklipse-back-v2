import { BaseRepository } from '@common/domain/repositories';
import { AccesorioUnidad } from '@inn/activos/identificacion/domain/entities';
import { EstadoAccesorioUnidad } from '@inn/activos/identificacion/domain/enums';
import { AccesorioUnidadRead } from '@inn/activos/identificacion/domain/read';

export interface IAccesorioUnidadRepository extends BaseRepository<AccesorioUnidad, AccesorioUnidadRead> {
  findByEquipoId(equipoId: number): Promise<AccesorioUnidadRead[]>;
  createFromEstandar(equipoId: number, accesorioEstandarId: number, parteSnap: string, estado?: EstadoAccesorioUnidad, observaciones?: string): Promise<AccesorioUnidad>;
  findByAccesorioEstandarId(accesorioEstandarId: number, equipoIds: number[]): Promise<AccesorioUnidad[]>;
  findEquipoIdsConAccesorio(accesorioEstandarId: number, equipoIds: number[]): Promise<number[]>;
}
