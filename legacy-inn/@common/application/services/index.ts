import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

export * from './cast-data';
export * from './collections';
export * from './cast-date';
export * from './json';
export * from './consecutivos';
export * from './crypto';
export * from './date-range';
export * from './decode-token';
export * from './group-by-key-optimized';
export * from './group-by-key';
export * from './objects';
export * from './rsa';
export * from './timer';
export * from './utilities';
export * from './interfaces';
export * from './slugs';
export * from './interfaces';

/** @deprecated No deberia ser necesaria esta función */
export const removeTimeZone = (date: Date) => {
  return new Date(date.getTime() - 300 * 60000);
};

/** @deprecated Realmente no devuelve una fecha */
export const getDateToString = (date: Date) => {
  const result = date.toISOString().split('T')[0];
  return new Date(`${result}:00:00`);
};

/** @deprecated El nombre no deja clara su función */
export const generateDateFromQuery = (date: Date, endOfDay = false) => {
  return new Date(`${date}${endOfDay ? ':23:59' : ':00:00'}`);
};

/** @deprecated Ubicación incorrecta */
export const getDiffInDays = (start: Date, end = new Date()) => {
  const fechaInicio = start.getTime();
  const fechaFin = end.getTime();
  const diff = fechaFin - fechaInicio;
  return diff / (1000 * 60 * 60 * 24);
};

export const findImageFromContext = (contexto: GcmContextType, centroId?: number) => {
  return `../private/clinicas/${
    contexto === GCM_CONTEXTS.ALTACENTRO
      ? centroId === undefined
        ? 'alta-centro.jpg'
        : centroId === 2
          ? 'alta-centro.jpg'
          : 'old-valledupar.jpg'
      : contexto === GCM_CONTEXTS.AGUACHICA
        ? 'aguachica.jpg'
        : contexto === GCM_CONTEXTS.AMMEDICAL
          ? 'ammedical.png'
          : contexto === GCM_CONTEXTS.SANJUAN
            ? 'sanjuan.jpg'
            : contexto === GCM_CONTEXTS.VALLEDUPAR
              ? 'valledupar.jpg'
              : 'ammedical.png'
  }`;
};

export const findFirmaFromCedula = (cedula: string) => {
  return `../private/firmas/${cedula}.png`;
};
