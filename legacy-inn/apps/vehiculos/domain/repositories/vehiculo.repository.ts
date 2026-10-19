import { BaseRepository } from '@common/domain/repositories';
import { Vehiculo } from '../entities';
import { VehiculoRead } from '../reads';
import { EstadoVehiculo, TipoActivo } from '../enums';

export interface VehiculoFilters {
  estado?: EstadoVehiculo;
  tipoActivo?: TipoActivo;
}

export interface VehiculoRepository extends BaseRepository<Vehiculo, VehiculoRead> {
  findViewById(id: number): Promise<VehiculoRead | null>;
  findAllAndCount(
    page: number,
    limit: number,
    search?: string,
    filters?: VehiculoFilters
  ): Promise<[VehiculoRead[], number]>;
  findViewByPlaca(placa: string): Promise<VehiculoRead | null>;
}
