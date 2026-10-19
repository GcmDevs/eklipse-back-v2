import { BaseRepository } from '@common/domain/repositories';
import { AccesorioUnidad } from '@equipos/domain/entities';
import { EstadoAccesorioUnidad } from '@equipos/domain/enums';
import { AccesorioUnidadRead } from '@equipos/domain/read';

export interface IAccesorioUnidadRepository extends BaseRepository<
  AccesorioUnidad,
  AccesorioUnidadRead
> {
  findByEquipoId(equipoId: number): Promise<AccesorioUnidadRead[]>;
  createFromEstandar(
    equipoId: number,
    accesorioEstandarId: number,
    parteSnap: string,
    estado?: EstadoAccesorioUnidad,
    observaciones?: string
  ): Promise<AccesorioUnidad>;
  findByAccesorioEstandarId(
    accesorioEstandarId: number,
    equipoIds: number[]
  ): Promise<AccesorioUnidad[]>;
  findEquipoIdsConAccesorio(accesorioEstandarId: number, equipoIds: number[]): Promise<number[]>;
}
