import { BadInputError } from '@common/domain/errors';
import { Vehiculo } from '../entities';
import { TipoActivo } from '../enums';
import { validateKilometrajeTanqueo } from './tanqueo-estacion.policies';

const KILOMETRAJE_VALIDATION_BY_ASSET_TYPE: Record<TipoActivo, { validatesKilometraje: boolean }> =
  {
    [TipoActivo.VEHICULO]: { validatesKilometraje: true },
    [TipoActivo.MAQUINA]: { validatesKilometraje: false },
  };

export function appliesKilometrajeValidation(tipoActivo: TipoActivo): boolean {
  return KILOMETRAJE_VALIDATION_BY_ASSET_TYPE[tipoActivo]?.validatesKilometraje ?? false;
}

export function validateTanqueoRegistrationKilometraje(
  activo: Vehiculo,
  kilometraje: number | null | undefined
): void {
  validateKilometrajeTanqueo(kilometraje);
  const requiresKm = appliesKilometrajeValidation(activo.getTipoActivo);
  if (requiresKm && kilometraje == null) {
    throw new BadInputError('El kilometraje es obligatorio para vehículos');
  }
  if (
    requiresKm &&
    activo.getKilometrajeActual != null &&
    kilometraje != null &&
    kilometraje < activo.getKilometrajeActual
  ) {
    throw new BadInputError(
      `El kilometraje (${kilometraje} km) es menor al ultimo registrado (${activo.getKilometrajeActual} km)`
    );
  }
}
