import { INN_MODULES } from './common';
const code = INN_MODULES.SUBS.RONDAS_HABITACIONES;
/** Administrar crea y consulta todas las rondas; ejecutar solo permite trabajar la ronda asignada. */
export const RONDAS_HABITACIONES_AUTHS = {
  CODE: code,
  ADMINISTRAR: `${code}001`,
  EJECUTAR: `${code}002`,
};
