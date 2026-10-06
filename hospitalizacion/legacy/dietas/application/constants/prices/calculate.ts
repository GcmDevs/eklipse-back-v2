import { JORNADAS_DIETA } from '@lgc/die/domain/types';
import { CONSISTENCIAS_LIQUIDAS, CONSISTENCIAS_SOLIDAS } from './constants';
import { ClasificacionType, ConsistenciaType, DataDieFPI, JornadaLclType } from './types';
import { dietasValues } from './values';

const getConsistencia = (codes: string[]): ConsistenciaType => {
  if (codes.some((consistencia: string) => CONSISTENCIAS_SOLIDAS.includes(consistencia)))
    return 'SOLIDA';
  else if (codes.some((consistencia: string) => CONSISTENCIAS_LIQUIDAS.includes(consistencia)))
    return 'LIQUIDA';
  else return 'NO DEFINIDA';
};

export const valueForDieta = (payload: DataDieFPI) => {
  const valuesForCtx = dietasValues(payload.context);
  const codes = payload.combinacionCode ? payload.combinacionCode.split('|') : [];

  const isDieFami = payload.isDietaFamiliar;
  const isMerien = payload.isMerienda;
  const isSolida = getConsistencia(codes) === 'SOLIDA';
  const isLiquida = getConsistencia(codes) === 'LIQUIDA';
  const isDesayuno = payload.jornada && payload.jornada === JORNADAS_DIETA.DESAYUNO;
  const isAlmuerzo = payload.jornada && payload.jornada === JORNADAS_DIETA.ALMUERZO;
  const isCena = payload.jornada && payload.jornada === JORNADAS_DIETA.CENA;

  const clasificacion: ClasificacionType = isMerien
    ? 'merienda'
    : isDieFami
      ? 'familiar'
      : isSolida
        ? 'solidos'
        : isLiquida
          ? 'liquidos'
          : 'no definido';

  const jornada: JornadaLclType = isDesayuno
    ? 'desayuno'
    : isAlmuerzo
      ? 'almuerzo'
      : isCena
        ? 'cena'
        : 'no definido';

  const result =
    clasificacion !== 'no definido' && jornada !== 'no definido'
      ? valuesForCtx?.[clasificacion][jornada]
      : undefined;

  if (result === undefined) throw new Error('No se pudo calcular el valor correctamente');

  return result;
};
