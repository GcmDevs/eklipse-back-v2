import { BadInputError } from '@common/domain/errors';
import { UnidadMedidaCombustible } from '../enums';

export const MAX_KILOMETRAJE = 2 ** 32 - 1;

export const MIN_VALOR_TANQUEO_ESTACION = 4_000;

export const MAX_VALOR_TANQUEO_ESTACION = 10_000_000;

export const MAX_GALONES_TANQUEO_ESTACION = 100;

export function validateKilometrajeTanqueo(kilometraje: number | null | undefined): void {
  if (kilometraje === undefined || kilometraje === null) return;

  if (!Number.isInteger(kilometraje) || kilometraje < 1 || kilometraje > MAX_KILOMETRAJE) {
    throw new BadInputError(
      `El kilometraje debe ser un entero entre 1 y ${MAX_KILOMETRAJE}`
    );
  }
}

export function validateValorTanqueoEstacion(valor: number): void {
  if (!Number.isFinite(valor) || valor < MIN_VALOR_TANQUEO_ESTACION || valor > MAX_VALOR_TANQUEO_ESTACION) {
    throw new BadInputError(
      `El valor pagado debe estar entre ${MIN_VALOR_TANQUEO_ESTACION} y ${MAX_VALOR_TANQUEO_ESTACION}`
    );
  }
}

export function validateCantidadCombustibleTanqueoEstacion(
  cantidad: number | null | undefined,
): void {
  if (cantidad === undefined || cantidad === null) {
    throw new BadInputError('La cantidad de combustible es obligatoria');
  }

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new BadInputError('La cantidad de combustible debe ser mayor que cero');
  }

  if (cantidad > MAX_GALONES_TANQUEO_ESTACION) {
    throw new BadInputError(
      `La cantidad de combustible no puede superar ${MAX_GALONES_TANQUEO_ESTACION} galones`
    );
  }
}

export function validateTanqueoItemEstacion(input: {
  estacionServicioId?: number | null;
  valorTotalPagado?: number | null;
  cantidadCombustible?: number | null;
  unidadMedidaCombustible?: unknown;
  kilometraje?: number | null;
  requiresKilometraje: boolean;
}): void {
  if (input.estacionServicioId == null) {
    throw new BadInputError('La estación de servicio es obligatoria');
  }
  if (input.valorTotalPagado == null) {
    throw new BadInputError('El valor pagado es obligatorio');
  }
  validateValorTanqueoEstacion(input.valorTotalPagado);
  validateCantidadCombustibleTanqueoEstacion(input.cantidadCombustible);
  if (!input.unidadMedidaCombustible) {
    throw new BadInputError('La unidad de medida del combustible es obligatoria');
  }
  if (input.requiresKilometraje) {
    if (input.kilometraje == null) {
      throw new BadInputError('El kilometraje es obligatorio para vehículos');
    }
    validateKilometrajeTanqueo(input.kilometraje);
  }
}
