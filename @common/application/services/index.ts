import { GCM_CONTEXTS, GcmContextType } from '../../domain/types';

export * from './cast-data';
export * from './crypto';
export * from './decode-token';
export * from './rsa';
export * from './group-by-key';
export * from './date';
export * from './timer';

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
