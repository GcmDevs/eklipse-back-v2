import { BadInputError } from '@common/domain/errors';
import { DomainError } from '@common/domain/errors/domain-error';
import { OrigenTanqueo } from '@vehiculos/domain/enums';
import { QueryFailedError } from 'typeorm';

export type VehiculosPersistenceScope =
  | 'station_tanqueo'
  | 'repository_tanqueo'
  | 'supply'
  | 'repository_movement';

const FK_VIOLATION_MESSAGES: Record<VehiculosPersistenceScope, string> = {
  station_tanqueo:
    'No se pudo registrar el tanqueo. Verifique el vehículo, la estación de servicio y los datos enviados.',
  repository_tanqueo:
    'No se pudo registrar el tanqueo. Verifique el vehículo, el repositorio de combustible y los datos enviados.',
  supply:
    'No se pudo registrar el abastecimiento. Verifique la estación de servicio y los datos enviados.',
  repository_movement:
    'No se pudo actualizar el repositorio de combustible. Verifique el stock y los datos enviados.',
};

function sqlServerErrorNumber(error: unknown): number | undefined {
  if (error instanceof QueryFailedError) {
    const driver = (error as QueryFailedError & { driverError?: { number?: number } }).driverError;
    return driver?.number;
  }
  if (error && typeof error === 'object' && 'number' in error) {
    return Number((error as { number: unknown }).number);
  }
  return undefined;
}

export function scopeForTanqueo(origen: OrigenTanqueo): VehiculosPersistenceScope {
  return origen === OrigenTanqueo.REPOSITORIO ? 'repository_tanqueo' : 'station_tanqueo';
}

export function rethrowVehiculosPersistenceError(
  error: unknown,
  scope: VehiculosPersistenceScope
): never {
  if (error instanceof DomainError) {
    throw error;
  }
  if (sqlServerErrorNumber(error) === 547) {
    throw new BadInputError(FK_VIOLATION_MESSAGES[scope]);
  }
  throw error;
}

export async function runVehiculosPersist<T>(
  scope: VehiculosPersistenceScope,
  work: () => Promise<T>
): Promise<T> {
  try {
    return await work();
  } catch (error) {
    rethrowVehiculosPersistenceError(error, scope);
  }
}
