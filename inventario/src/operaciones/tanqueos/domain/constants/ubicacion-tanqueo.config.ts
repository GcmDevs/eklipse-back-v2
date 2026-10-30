import { ModoValidacionUbicacion } from '../enums/catalogos.enums';

export interface UbicacionTanqueoConfig {
  modo: ModoValidacionUbicacion;
  radioMetros: number;
  precisionMaxMetros: number;
  edadMaxCapturaMinutos: number;
  duracionMaxFormMinutos: number;
  velocidadMaxKmh: number;
  discrepanciaMinMinutos: number;
  toleranciaRelojFuturoMinutos: number;
}

export const UBICACION_TANQUEO_DEFAULTS: Readonly<UbicacionTanqueoConfig> = {
  modo: ModoValidacionUbicacion.ACTIVE,
  radioMetros: 70,
  precisionMaxMetros: 100,
  edadMaxCapturaMinutos: 5,
  duracionMaxFormMinutos: 60,
  velocidadMaxKmh: 150,
  discrepanciaMinMinutos: 0,
  toleranciaRelojFuturoMinutos: 5,
} as const;

export const GEO_RADIO_MIN_M = 20;
export const GEO_RADIO_MAX_M = 2000;

function parseModo(raw: string | undefined): ModoValidacionUbicacion {
  if (!raw) return UBICACION_TANQUEO_DEFAULTS.modo;
  const normalized = raw.trim().toUpperCase();
  if (
    normalized === ModoValidacionUbicacion.OFF ||
    normalized === ModoValidacionUbicacion.SHADOW ||
    normalized === ModoValidacionUbicacion.ACTIVE
  ) {
    return normalized as ModoValidacionUbicacion;
  }
  console.warn(
    `[UbicacionTanqueoConfig] GEO_VALIDACION_MODO inválido ("${raw}"). Usando default "${UBICACION_TANQUEO_DEFAULTS.modo}".`,
  );
  return UBICACION_TANQUEO_DEFAULTS.modo;
}

function parseRadioMetros(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return UBICACION_TANQUEO_DEFAULTS.radioMetros;
  }
  const trimmed = raw.trim();
  const parsed = Number(trimmed);
  if (
    !Number.isInteger(parsed) ||
    !/^-?\d+$/.test(trimmed) ||
    parsed < GEO_RADIO_MIN_M ||
    parsed > GEO_RADIO_MAX_M
  ) {
    console.warn(
      `[UbicacionTanqueoConfig] GEO_RADIO_M inválido ("${raw}"); debe ser un entero entre ${GEO_RADIO_MIN_M} y ${GEO_RADIO_MAX_M}. Usando default ${UBICACION_TANQUEO_DEFAULTS.radioMetros} m.`,
    );
    return UBICACION_TANQUEO_DEFAULTS.radioMetros;
  }
  return parsed;
}

function parseNonNegativeNumber(
  raw: string | undefined,
  defaultValue: number,
  envName: string,
  allowZero = true,
): number {
  if (raw === undefined || raw.trim() === '') return defaultValue;
  const parsed = Number(raw.trim());
  const valid = allowZero ? Number.isFinite(parsed) && parsed >= 0 : Number.isFinite(parsed) && parsed > 0;
  if (!valid) {
    console.warn(
      `[UbicacionTanqueoConfig] ${envName} inválido ("${raw}"). Usando default ${defaultValue}.`,
    );
    return defaultValue;
  }
  return parsed;
}

export function loadUbicacionTanqueoConfig(
  env: Record<string, string | undefined> = process.env,
): UbicacionTanqueoConfig {
  return {
    modo: parseModo(env.GEO_VALIDACION_MODO),
    radioMetros: parseRadioMetros(env.GEO_RADIO_M),
    precisionMaxMetros: parseNonNegativeNumber(
      env.GEO_PRECISION_MAX_M,
      UBICACION_TANQUEO_DEFAULTS.precisionMaxMetros,
      'GEO_PRECISION_MAX_M',
      false,
    ),
    edadMaxCapturaMinutos: parseNonNegativeNumber(
      env.GEO_EDAD_MAX_CAPTURA_MIN,
      UBICACION_TANQUEO_DEFAULTS.edadMaxCapturaMinutos,
      'GEO_EDAD_MAX_CAPTURA_MIN',
      false,
    ),
    duracionMaxFormMinutos: parseNonNegativeNumber(
      env.GEO_DURACION_MAX_FORM_MIN,
      UBICACION_TANQUEO_DEFAULTS.duracionMaxFormMinutos,
      'GEO_DURACION_MAX_FORM_MIN',
      false,
    ),
    velocidadMaxKmh: parseNonNegativeNumber(
      env.GEO_VELOCIDAD_MAX_KMH,
      UBICACION_TANQUEO_DEFAULTS.velocidadMaxKmh,
      'GEO_VELOCIDAD_MAX_KMH',
      false,
    ),
    discrepanciaMinMinutos: parseNonNegativeNumber(
      env.GEO_DISCREPANCIA_MIN_MIN,
      UBICACION_TANQUEO_DEFAULTS.discrepanciaMinMinutos,
      'GEO_DISCREPANCIA_MIN_MIN',
      true,
    ),
    toleranciaRelojFuturoMinutos: UBICACION_TANQUEO_DEFAULTS.toleranciaRelojFuturoMinutos,
  };
}

const INITIAL_UBICACION_TANQUEO_CONFIG: UbicacionTanqueoConfig = loadUbicacionTanqueoConfig();

export function getUbicacionTanqueoConfig(): UbicacionTanqueoConfig {
  return INITIAL_UBICACION_TANQUEO_CONFIG;
}

