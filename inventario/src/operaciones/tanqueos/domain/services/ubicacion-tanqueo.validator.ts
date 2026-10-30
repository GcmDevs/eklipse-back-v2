import {
  UBICACION_TANQUEO_DEFAULTS,
  UbicacionTanqueoConfig,
} from '../constants/ubicacion-tanqueo.config';
import {
  CodigoInconsistencia,
  ModoValidacionUbicacion,
  MotivoUbicacionNoDisponible,
  OrigenTanqueo,
  ResultadoValidacionUbicacion,
  TipoRegistroTanqueo,
} from '../enums/catalogos.enums';

export const EARTH_RADIUS_METERS = 6_371_000;

export interface CoordenadasPuntoInput {
  latitud: number;
  longitud: number;
  precisionMetros?: number | null;
}

export interface CapturaUbicacionInput {
  latitud: number;
  longitud: number;
  precisionMetros: number | null;
  fechaCaptura: Date | null;
}

export interface ValidacionUbicacionSnapshot {
  resultado: ResultadoValidacionUbicacion;
  distanciaMetros: number | null;
  distanciaInicialMetros: number | null;
  radioAplicadoMetros: number | null;
  precisionMetros: number | null;
  latitud: number | null;
  longitud: number | null;
  fechaCaptura: Date | null;
  ubicacionInicial: CapturaUbicacionInput | null;
  motivoNoDisponible: MotivoUbicacionNoDisponible | string | null;
  gpsSimulado: boolean | null;
  fechaValidacion: Date;
}

export interface EvaluacionUbicacionTanqueoResult {
  snapshot: ValidacionUbicacionSnapshot | null;
  codigoInconsistencia:
  | CodigoInconsistencia.UBIC_FUERA_RAD
  | CodigoInconsistencia.UBIC_DISCREP
  | CodigoInconsistencia.UBIC_NO_CONC
  | null;
  mensajeInconsistencia: string | null;
}

export interface ValidarUbicacionTanqueoInput {
  origen: OrigenTanqueo;
  tipoRegistro?: TipoRegistroTanqueo | null;
  estacionUbicacion?: CoordenadasPuntoInput | null;
  capturaFinal?: CapturaUbicacionInput | null;
  capturaInicial?: CapturaUbicacionInput | null;
  motivoNoDisponible?: MotivoUbicacionNoDisponible | string | null;
  gpsSimulado?: boolean | null;
  fechaTanqueo: Date;
  ahora: Date;
  config?: UbicacionTanqueoConfig;
  radioMetrosOverride?: number;
}

type EstadoCapturaIndividual = 'DENTRO' | 'FUERA' | 'NO_CONCLUYENTE';

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function roundMeters(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula la distancia geodésica en metros entre dos coordenadas usando Haversine (R = 6.371.000 m).
 */
export function calcularDistanciaHaversineMetros(
  origen: { latitud: number; longitud: number },
  destino: { latitud: number; longitud: number },
): number {
  const dLat = toRadians(destino.latitud - origen.latitud);
  const dLon = toRadians(destino.longitud - origen.longitud);
  const lat1 = toRadians(origen.latitud);
  const lat2 = toRadians(destino.latitud);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const a =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return roundMeters(EARTH_RADIUS_METERS * c);
}

export function evaluarCapturaContraRadio(
  distanciaMetros: number,
  precisionMetros: number | null | undefined,
  radioMetros: number,
  precisionMaxMetros: number,
): EstadoCapturaIndividual {
  const precision = precisionMetros != null ? Number(precisionMetros) : 0;
  if (precision > precisionMaxMetros) {
    return 'NO_CONCLUYENTE';
  }
  if (distanciaMetros - precision > radioMetros) {
    return 'FUERA';
  }
  return 'DENTRO';
}

function normalizeCaptura(
  captura: CapturaUbicacionInput | null | undefined,
): CapturaUbicacionInput | null {
  if (
    !captura ||
    captura.latitud === null ||
    captura.latitud === undefined ||
    captura.longitud === null ||
    captura.longitud === undefined ||
    Number.isNaN(Number(captura.latitud)) ||
    Number.isNaN(Number(captura.longitud))
  ) {
    return null;
  }
  return {
    latitud: Number(captura.latitud),
    longitud: Number(captura.longitud),
    precisionMetros:
      captura.precisionMetros !== null &&
        captura.precisionMetros !== undefined &&
        !Number.isNaN(Number(captura.precisionMetros))
        ? Number(captura.precisionMetros)
        : null,
    fechaCaptura:
      captura.fechaCaptura instanceof Date && !Number.isNaN(captura.fechaCaptura.getTime())
        ? captura.fechaCaptura
        : null,
  };
}

function hasValidEstacionCoords(
  estacion: CoordenadasPuntoInput | null | undefined,
): estacion is CoordenadasPuntoInput {
  return (
    !!estacion &&
    estacion.latitud !== null &&
    estacion.latitud !== undefined &&
    estacion.longitud !== null &&
    estacion.longitud !== undefined &&
    !Number.isNaN(Number(estacion.latitud)) &&
    !Number.isNaN(Number(estacion.longitud))
  );
}

/**
 * Validador puro de dominio para la ubicación de un tanqueo frente a la estación de servicio.
 */
export function validarUbicacionTanqueo(
  input: ValidarUbicacionTanqueoInput,
): EvaluacionUbicacionUbicacionInternalResult {
  const config = input.config ?? UBICACION_TANQUEO_DEFAULTS;
  if (config.modo === ModoValidacionUbicacion.OFF) {
    return {
      snapshot: null,
      codigoInconsistencia: null,
      mensajeInconsistencia: null,
    };
  }

  const tipoRegistro = input.tipoRegistro ?? TipoRegistroTanqueo.CONDUCTOR;
  const finalNorm = normalizeCaptura(input.capturaFinal);
  const inicialNorm = normalizeCaptura(input.capturaInicial);
  const motivoNoDisponible = input.motivoNoDisponible ?? null;
  const gpsSimulado =
    input.gpsSimulado === true ? true : input.gpsSimulado === false ? false : null;

  if (
    input.origen !== OrigenTanqueo.ESTACION ||
    tipoRegistro !== TipoRegistroTanqueo.CONDUCTOR
  ) {
    return {
      snapshot: {
        resultado: ResultadoValidacionUbicacion.NO_VALIDADO,
        distanciaMetros: null,
        distanciaInicialMetros: null,
        radioAplicadoMetros: null,
        precisionMetros: finalNorm?.precisionMetros ?? null,
        latitud: finalNorm?.latitud ?? null,
        longitud: finalNorm?.longitud ?? null,
        fechaCaptura: finalNorm?.fechaCaptura ?? null,
        ubicacionInicial: inicialNorm,
        motivoNoDisponible,
        gpsSimulado,
        fechaValidacion: input.ahora,
      },
      codigoInconsistencia: null,
      mensajeInconsistencia: null,
    };
  }

  const radioMetros = input.radioMetrosOverride ?? config.radioMetros;

  // Estación sin coordenadas -> NO_CONCLUYENTE, SIN inconsistencia (dato maestro)
  if (!hasValidEstacionCoords(input.estacionUbicacion)) {
    return {
      snapshot: {
        resultado: ResultadoValidacionUbicacion.NO_CONCLUYENTE,
        distanciaMetros: null,
        distanciaInicialMetros: null,
        radioAplicadoMetros: radioMetros,
        precisionMetros: finalNorm?.precisionMetros ?? null,
        latitud: finalNorm?.latitud ?? null,
        longitud: finalNorm?.longitud ?? null,
        fechaCaptura: finalNorm?.fechaCaptura ?? null,
        ubicacionInicial: inicialNorm,
        motivoNoDisponible,
        gpsSimulado,
        fechaValidacion: input.ahora,
      },
      codigoInconsistencia: null,
      mensajeInconsistencia: null,
    };
  }

  const estacionCoords = {
    latitud: Number(input.estacionUbicacion.latitud),
    longitud: Number(input.estacionUbicacion.longitud),
  };

  const distanciaMetros = finalNorm
    ? calcularDistanciaHaversineMetros(finalNorm, estacionCoords)
    : null;
  const distanciaInicialMetros = inicialNorm
    ? calcularDistanciaHaversineMetros(inicialNorm, estacionCoords)
    : null;

  const buildResult = (
    resultado: ResultadoValidacionUbicacion,
    codigoInconsistencia:
      | CodigoInconsistencia.UBIC_FUERA_RAD
      | CodigoInconsistencia.UBIC_DISCREP
      | CodigoInconsistencia.UBIC_NO_CONC
      | null,
    mensajeInconsistencia: string | null,
  ): EvaluacionUbicacionTanqueoResult => ({
    snapshot: {
      resultado,
      distanciaMetros,
      distanciaInicialMetros,
      radioAplicadoMetros: radioMetros,
      precisionMetros: finalNorm?.precisionMetros ?? null,
      latitud: finalNorm?.latitud ?? null,
      longitud: finalNorm?.longitud ?? null,
      fechaCaptura: finalNorm?.fechaCaptura ?? null,
      ubicacionInicial: inicialNorm,
      motivoNoDisponible,
      gpsSimulado,
      fechaValidacion: input.ahora,
    },
    codigoInconsistencia,
    mensajeInconsistencia,
  });

  // 1. Captura final ausente
  if (!finalNorm || !finalNorm.fechaCaptura) {
    const detalleMotivo = motivoNoDisponible
      ? ` (motivo: ${motivoNoDisponible})`
      : '';
    return buildResult(
      ResultadoValidacionUbicacion.NO_CONCLUYENTE,
      CodigoInconsistencia.UBIC_NO_CONC,
      `No fue posible validar la ubicación del tanqueo: ubicación final no disponible${detalleMotivo}.`,
    );
  }

  // 2. GPS simulado reportado por app nativa
  if (gpsSimulado === true) {
    return buildResult(
      ResultadoValidacionUbicacion.NO_CONCLUYENTE,
      CodigoInconsistencia.UBIC_NO_CONC,
      'La ubicación del tanqueo fue reportada como GPS simulado.',
    );
  }

  // 3. Fecha de captura futura respecto al servidor (tolerancia 5 min)
  const toleranciaFuturoMs = config.toleranciaRelojFuturoMinutos * 60_000;
  if (finalNorm.fechaCaptura.getTime() - input.ahora.getTime() > toleranciaFuturoMs) {
    return buildResult(
      ResultadoValidacionUbicacion.NO_CONCLUYENTE,
      CodigoInconsistencia.UBIC_NO_CONC,
      'La fecha de captura de ubicación supera la hora del servidor más allá de la tolerancia permitida.',
    );
  }

  // 4. |fechaCapturaUbicacion - fechaTanqueo| > EDAD_MAX
  const edadMaxMs = config.edadMaxCapturaMinutos * 60_000;
  const diffTanqueoMs = Math.abs(
    finalNorm.fechaCaptura.getTime() - input.fechaTanqueo.getTime(),
  );
  if (diffTanqueoMs > edadMaxMs) {
    return buildResult(
      ResultadoValidacionUbicacion.NO_CONCLUYENTE,
      CodigoInconsistencia.UBIC_NO_CONC,
      `La diferencia entre la captura de ubicación y la fecha del tanqueo excede el máximo permitido (${config.edadMaxCapturaMinutos} min).`,
    );
  }

  // 5. Evaluación de la captura final
  const estadoFinal = evaluarCapturaContraRadio(
    distanciaMetros!,
    finalNorm.precisionMetros,
    radioMetros,
    config.precisionMaxMetros,
  );

  if (estadoFinal === 'NO_CONCLUYENTE') {
    return buildResult(
      ResultadoValidacionUbicacion.NO_CONCLUYENTE,
      CodigoInconsistencia.UBIC_NO_CONC,
      `La precisión GPS de la captura final (${finalNorm.precisionMetros} m) supera el umbral máximo permitido (${config.precisionMaxMetros} m).`,
    );
  }

  // 6. Evaluación de la captura inicial (si existe y es utilizable en tiempo)
  let inicialUtilizable = false;
  let deltaCapturaMinutos = 0;

  if (inicialNorm && inicialNorm.fechaCaptura) {
    const deltaMs =
      finalNorm.fechaCaptura.getTime() - inicialNorm.fechaCaptura.getTime();
    const duracionMaxMs = config.duracionMaxFormMinutos * 60_000;

    // Inicial inutilizable (posterior a la final o más antigua que DURACION_MAX_FORM) -> se ignora
    if (deltaMs >= 0 && deltaMs <= duracionMaxMs) {
      inicialUtilizable = true;
      deltaCapturaMinutos = deltaMs / 60_000;

      // Velocidad implícita entre capturas > VELOCIDAD_MAX -> NO_CONCLUYENTE + UBIC_NO_CONC
      const distanciaEntreCapturasM = calcularDistanciaHaversineMetros(
        inicialNorm,
        finalNorm,
      );
      const horas = deltaMs / 3_600_000;
      const velocidadImplKmh =
        horas > 0
          ? distanciaEntreCapturasM / 1000 / horas
          : distanciaEntreCapturasM > 0
            ? Number.POSITIVE_INFINITY
            : 0;

      if (velocidadImplKmh > config.velocidadMaxKmh) {
        return buildResult(
          ResultadoValidacionUbicacion.NO_CONCLUYENTE,
          CodigoInconsistencia.UBIC_NO_CONC,
          `La velocidad implícita entre la captura inicial y final supera el umbral máximo (${config.velocidadMaxKmh} km/h).`,
        );
      }
    }
  }

  // 7. Final FUERA -> FUERA_RADIO + UBIC_FUERA_RAD
  if (estadoFinal === 'FUERA') {
    return buildResult(
      ResultadoValidacionUbicacion.FUERA_RADIO,
      CodigoInconsistencia.UBIC_FUERA_RAD,
      `El tanqueo se registró a ${distanciaMetros} m de la estación (radio permitido: ${radioMetros} m).`,
    );
  }

  // 8. Final DENTRO: evaluar discrepancia con captura inicial si es utilizable
  if (inicialUtilizable && inicialNorm && distanciaInicialMetros !== null) {
    const estadoInicial = evaluarCapturaContraRadio(
      distanciaInicialMetros,
      inicialNorm.precisionMetros,
      radioMetros,
      config.precisionMaxMetros,
    );

    if (
      estadoInicial === 'FUERA' &&
      deltaCapturaMinutos >= config.discrepanciaMinMinutos
    ) {
      return buildResult(
        ResultadoValidacionUbicacion.DISCREPANCIA,
        CodigoInconsistencia.UBIC_DISCREP,
        `El formulario se abrió fuera del radio de la estación (${distanciaInicialMetros} m) y se guardó dentro del radio (${distanciaMetros} m).`,
      );
    }
  }

  // 9. Final DENTRO e inicial DENTRO o ausente/ignorada -> DENTRO_RADIO
  return buildResult(ResultadoValidacionUbicacion.DENTRO_RADIO, null, null);
}

type EvaluacionUbicacionUbicacionInternalResult = EvaluacionUbicacionTanqueoResult;

