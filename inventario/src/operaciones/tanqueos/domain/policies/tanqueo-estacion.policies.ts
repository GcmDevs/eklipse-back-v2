import { BadInputError } from '@common/domain/errors';
import { TANQUEOS_UMBRALES } from '../constants/tanqueos-umbrales.config';
import { MotivoUbicacionNoDisponible, UnidadMedidaCombustible } from '../enums';

export const MAX_KILOMETRAJE = TANQUEOS_UMBRALES.kilometrajeMax;

export const MIN_VALOR_TANQUEO_ESTACION_ALERTA = TANQUEOS_UMBRALES.valorPagadoMinAlerta;
export const MAX_VALOR_TANQUEO_ESTACION_ALERTA = TANQUEOS_UMBRALES.valorPagadoMaxAlerta;

export function validateKilometrajeTanqueo(kilometraje: number | null | undefined): void {
  if (kilometraje === undefined || kilometraje === null) return;

  if (!Number.isInteger(kilometraje) || kilometraje < 1 || kilometraje > MAX_KILOMETRAJE) {
    throw new BadInputError(
      `El kilometraje debe ser un entero entre 1 y ${MAX_KILOMETRAJE}`
    );
  }
}

export function validateValorPagadoPositivo(valor: number): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new BadInputError('El valor pagado debe ser mayor que cero');
  }
}

export function isValorPagadoFueraDeRangoAlerta(valor: number): boolean {
  return valor < MIN_VALOR_TANQUEO_ESTACION_ALERTA || valor > MAX_VALOR_TANQUEO_ESTACION_ALERTA;
}

export function validateCantidadCombustibleRegistro(
  cantidad: number | null | undefined
): void {
  if (cantidad === undefined || cantidad === null) {
    throw new BadInputError('La cantidad de combustible es obligatoria');
  }
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new BadInputError('La cantidad de combustible debe ser mayor que cero');
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
  validateValorPagadoPositivo(input.valorTotalPagado);
  validateCantidadCombustibleRegistro(input.cantidadCombustible);
  if (!input.unidadMedidaCombustible) {
    throw new BadInputError('La unidad de medida del combustible es obligatoria');
  }
  if (!(Object.values(UnidadMedidaCombustible) as unknown[]).includes(input.unidadMedidaCombustible)) {
    throw new BadInputError('La unidad de medida del combustible es inválida');
  }
  if (input.requiresKilometraje) {
    if (input.kilometraje == null) {
      throw new BadInputError('El kilometraje es obligatorio para vehículos con odómetro funcional');
    }
    validateKilometrajeTanqueo(input.kilometraje);
  }
}

export function validateUbicacionTanqueoItemPayload(input: {
  latitud?: number | null;
  longitud?: number | null;
  precisionMetros?: number | null;
  fechaCapturaUbicacion?: Date | string | null;
  ubicacionInicial?: {
    latitud?: number | null;
    longitud?: number | null;
    precisionMetros?: number | null;
    fechaCaptura?: Date | string | null;
  } | null;
  ubicacionNoDisponibleMotivo?: string | null;
}): void {
  const hasLat = input.latitud !== undefined && input.latitud !== null;
  const hasLon = input.longitud !== undefined && input.longitud !== null;
  const hasPrecision = input.precisionMetros !== undefined && input.precisionMetros !== null;
  const hasFechaCap =
    input.fechaCapturaUbicacion !== undefined &&
    input.fechaCapturaUbicacion !== null &&
    input.fechaCapturaUbicacion !== '';
  const hasMotivo =
    input.ubicacionNoDisponibleMotivo !== undefined &&
    input.ubicacionNoDisponibleMotivo !== null &&
    input.ubicacionNoDisponibleMotivo !== '';

  if ((hasLat || hasLon || hasFechaCap) && !(hasLat && hasLon && hasFechaCap)) {
    throw new BadInputError(
      'Las coordenadas deben enviarse completas (latitud, longitud y fechaCapturaUbicacion) o ausentes'
    );
  }

  if (hasMotivo && (hasLat || hasLon || hasFechaCap)) {
    throw new BadInputError(
      'ubicacionNoDisponibleMotivo es excluyente con el envío de coordenadas'
    );
  }

  if (
    hasMotivo &&
    !(Object.values(MotivoUbicacionNoDisponible) as string[]).includes(
      String(input.ubicacionNoDisponibleMotivo)
    )
  ) {
    throw new BadInputError('El motivo de ubicación no disponible es inválido');
  }

  if (hasLat && hasLon) {
    const lat = Number(input.latitud);
    const lon = Number(input.longitud);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new BadInputError('La latitud debe estar entre -90 y 90');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new BadInputError('La longitud debe estar entre -180 y 180');
    }
  }

  if (hasPrecision) {
    const prec = Number(input.precisionMetros);
    if (!Number.isFinite(prec) || prec < 0) {
      throw new BadInputError('La precisión en metros debe ser mayor o igual a 0');
    }
  }

  if (hasFechaCap) {
    const parsed =
      input.fechaCapturaUbicacion instanceof Date
        ? input.fechaCapturaUbicacion
        : new Date(String(input.fechaCapturaUbicacion));
    if (Number.isNaN(parsed.getTime())) {
      throw new BadInputError('La fecha de captura de ubicación es inválida');
    }
  }

  if (input.ubicacionInicial !== undefined && input.ubicacionInicial !== null) {
    const ini = input.ubicacionInicial;
    const iniHasLat = ini.latitud !== undefined && ini.latitud !== null;
    const iniHasLon = ini.longitud !== undefined && ini.longitud !== null;
    const iniHasFecha =
      ini.fechaCaptura !== undefined && ini.fechaCaptura !== null && ini.fechaCaptura !== '';

    if (!iniHasLat || !iniHasLon || !iniHasFecha) {
      throw new BadInputError(
        'ubicacionInicial debe incluir latitud, longitud y fechaCaptura'
      );
    }

    const iniLat = Number(ini.latitud);
    const iniLon = Number(ini.longitud);
    if (!Number.isFinite(iniLat) || iniLat < -90 || iniLat > 90) {
      throw new BadInputError('La latitud inicial debe estar entre -90 y 90');
    }
    if (!Number.isFinite(iniLon) || iniLon < -180 || iniLon > 180) {
      throw new BadInputError('La longitud inicial debe estar entre -180 y 180');
    }

    if (ini.precisionMetros !== undefined && ini.precisionMetros !== null) {
      const iniPrec = Number(ini.precisionMetros);
      if (!Number.isFinite(iniPrec) || iniPrec < 0) {
        throw new BadInputError('La precisión inicial en metros debe ser mayor o igual a 0');
      }
    }

    const iniDate =
      ini.fechaCaptura instanceof Date ? ini.fechaCaptura : new Date(String(ini.fechaCaptura));
    if (Number.isNaN(iniDate.getTime())) {
      throw new BadInputError('La fecha de captura de la ubicación inicial es inválida');
    }
  }
}
