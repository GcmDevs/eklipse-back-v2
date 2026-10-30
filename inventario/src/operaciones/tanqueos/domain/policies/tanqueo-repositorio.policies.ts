import { ResourceNotFoundError } from '@common/domain/errors';
import { RepositorioCombustible, Vehiculo } from '../entities';
import { EstadoVehiculo } from '../enums';

export function assertRepositoryTanqueoRegistrationRefs(
  activo: Vehiculo | null,
  repositorio: RepositorioCombustible | null
): { activo: Vehiculo; repositorio: RepositorioCombustible } {
  if (!activo || activo.getEstado !== EstadoVehiculo.ACTIVA) {
    throw new ResourceNotFoundError('El activo no existe o no está activo');
  }
  if (!repositorio) {
    throw new ResourceNotFoundError('El repositorio de combustible no existe');
  }
  return { activo, repositorio };
}
