import { BadInputError } from '@common/domain/errors';
import { Vehiculo } from '../entities';
import { EstadoOdometro, TipoActivo } from '../enums';
import { validateKilometrajeTanqueo } from './tanqueo-estacion.policies';

const KILOMETRAJE_VALIDATION_BY_ASSET_TYPE: Record<TipoActivo, { validatesKilometraje: boolean }> =
  {
    [TipoActivo.VEHICULO]: { validatesKilometraje: true },
    [TipoActivo.MAQUINA]: { validatesKilometraje: false },
  };

export function appliesKilometrajeValidation(tipoActivo: TipoActivo): boolean {
  return KILOMETRAJE_VALIDATION_BY_ASSET_TYPE[tipoActivo]?.validatesKilometraje ?? false;
}

export function requiresOdometroPlausibilidad(activo: Vehiculo): boolean {
  return (
    appliesKilometrajeValidation(activo.getTipoActivo) &&
    activo.getOdometroEstado === EstadoOdometro.FUNCIONANDO
  );
}

export function validateTanqueoRegistrationKilometraje(
  activo: Vehiculo,
  kilometraje: number | null | undefined
): void {
  const requiresKm = requiresOdometroPlausibilidad(activo);
  if (requiresKm && kilometraje == null) {
    throw new BadInputError(
      'El kilometraje es obligatorio para vehículos con odómetro en estado FUNCIONANDO'
    );
  }
  if (kilometraje != null) {
    validateKilometrajeTanqueo(kilometraje);
  }
}

export function resolveKilometrajeReferencia(lecturaConfiableKm: number | null): number | null {
  return lecturaConfiableKm;
}
