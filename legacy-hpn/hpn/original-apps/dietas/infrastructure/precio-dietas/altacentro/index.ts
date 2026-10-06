import { JORNADAS_DIETA, JornadaType } from '@lgc/die/domain/types/local';
import { CONSISTENCIAS_LIQUIDAS, CONSISTENCIAS_SOLIDAS, DataDieFPI } from '../common';

const dietaTradicional = (combinacionCode: string, jornada: JornadaType) => {
  if (!combinacionCode) return 0;

  const codigos = combinacionCode.split('|');

  const isConsistenciaSolida = () =>
    codigos.some((consistencia: string) => CONSISTENCIAS_SOLIDAS.includes(consistencia));

  const isConsistenciaLiquida = () =>
    codigos.some((consistencia: string) => CONSISTENCIAS_LIQUIDAS.includes(consistencia));

  if (isConsistenciaSolida()) {
    switch (jornada) {
      case JORNADAS_DIETA.DESAYUNO:
        return 6466;
      case JORNADAS_DIETA.ALMUERZO:
        return 7100;
      case JORNADAS_DIETA.CENA:
        return 6466;
    }
  } else if (isConsistenciaLiquida()) {
    return 4000;
  } else {
    return 0;
  }
};

export const merienda = () => {
  return 3784;
};

const dietaFamiliar = (jornada: JornadaType) => {
  switch (jornada) {
    case JORNADAS_DIETA.DESAYUNO:
      return 6466;
    case JORNADAS_DIETA.ALMUERZO:
      return 7100;
    case JORNADAS_DIETA.CENA:
      return 6466;
  }
};

const valuesForDie = (payload: DataDieFPI) => {
  if (payload.isMerienda) {
    return merienda();
  } else if (payload.isDietaFamiliar) {
    return dietaFamiliar(payload.jornada);
  } else {
    return dietaTradicional(payload.combinacionCode, payload.jornada);
  }
};

export const getPrecioDietaAltaCentro = (payload: DataDieFPI) => {
  return valuesForDie(payload);
};
