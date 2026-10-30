import { Tanqueo } from '../entities';
import { CodigoInconsistencia, OrigenTanqueo } from '../enums';
import {
  FACTOR_VALOR_ALTO,
  MIN_MUESTRA_VALOR_ALTO,
} from '../policies/tanqueo-inconsistencias.policies';
import { Inconsistencia } from '../types';
import { Kilometraje } from '../value-objects';

export const CODIGOS_INCONSISTENCIA_DATOS: readonly CodigoInconsistencia[] = [
  CodigoInconsistencia.KM_MENOR_ANT,
  CodigoInconsistencia.KM_SALTO,
  CodigoInconsistencia.CANT_COMB_CAP,
  CodigoInconsistencia.VALOR_ALTO_INU,
  CodigoInconsistencia.TQ_DUP,
];

export const CODIGOS_INCONSISTENCIA_UBICACION: readonly CodigoInconsistencia[] = [
  CodigoInconsistencia.UBIC_FUERA_RAD,
  CodigoInconsistencia.UBIC_DISCREP,
  CodigoInconsistencia.UBIC_NO_CONC,
];

export function isCodigoInconsistenciaDatos(codigo: CodigoInconsistencia): boolean {
  return (CODIGOS_INCONSISTENCIA_DATOS as readonly string[]).includes(codigo);
}

export function isCodigoInconsistenciaUbicacion(codigo: CodigoInconsistencia): boolean {
  return (CODIGOS_INCONSISTENCIA_UBICACION as readonly string[]).includes(codigo);
}

export type EvaluarInconsistenciasDatosContext = {
  validaOdometro: boolean;
  kmAnterior: Kilometraje | null;
  umbralSalto: number;
  capacidadTanque: number | null;
  promedioValor: number | null;
  muestraValor: number;
  duplicadoSospechoso: boolean;
};

export function evaluarInconsistenciasDatosDelTanqueo(
  tanqueo: Tanqueo,
  ctx: EvaluarInconsistenciasDatosContext
): Inconsistencia[] {
  const probe = Tanqueo.rebuild(
    tanqueo.getId.getValor,
    tanqueo.getCodigo,
    tanqueo.getActivoId.getValor,
    tanqueo.getRegistradoPorId.getValor,
    tanqueo.getTipoRegistro,
    tanqueo.getCanalRegistro,
    tanqueo.getConductorRealId?.getValor ?? null,
    tanqueo.getOrigen,
    tanqueo.getRepositorioId?.getValor ?? null,
    tanqueo.getKilometraje,
    tanqueo.getKilometrosRecorridos,
    tanqueo.getValorTotalPagado,
    tanqueo.getCantidadCombustible,
    tanqueo.getTipoCombustible,
    tanqueo.getRendimiento,
    tanqueo.getEstacionServicioId?.getValor ?? null,
    tanqueo.getFechaTanqueo,
    tanqueo.getUbicacion,
    tanqueo.getObservaciones,
    tanqueo.getEstado,
    tanqueo.getEvidencias,
    tanqueo.getOrigenRegistro,
    tanqueo.getDecididoPorUsuarioId?.getValor ?? null,
    tanqueo.getFechaDecision,
    tanqueo.getMotivoDecision,
    tanqueo.getAprobacionConOverride,
    tanqueo.getAnuladoPorId?.getValor ?? null,
    tanqueo.getFechaAnulacion,
    tanqueo.getMotivoAnulacion,
    [],
    tanqueo.getCreatedAt,
    tanqueo.getUpdatedAt,
    tanqueo.getValidacionUbicacion
  );

  if (ctx.validaOdometro && probe.getKilometraje && ctx.kmAnterior) {
    probe.registerInconsistenciaKilometraje(ctx.kmAnterior, ctx.umbralSalto);
  }
  probe.registerInconsistenciaCapacidad(ctx.capacidadTanque);

  if (probe.getOrigen === OrigenTanqueo.ESTACION && probe.getValorTotalPagado) {
    probe.registerInconsistenciaValorAlto(
      ctx.muestraValor >= MIN_MUESTRA_VALOR_ALTO ? ctx.promedioValor : null,
      FACTOR_VALOR_ALTO
    );
  }
  if (ctx.duplicadoSospechoso) {
    probe.registerInconsistenciaDuplicadoSospechoso();
  }

  return probe.getInconsistencias;
}
