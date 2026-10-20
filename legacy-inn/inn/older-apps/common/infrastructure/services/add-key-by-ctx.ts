import { GcmContexts } from '@common/application/constants';

export const addKeyByCtx = (key: number | string, ctx: GcmContexts, centroId = 1) => {
  let finalKey = '';

  switch (ctx) {
    case GcmContexts.AGUACHICA: {
      finalKey = 'AGU';
      break;
    }
    case GcmContexts.ALTACENTRO: {
      if (centroId === 1) finalKey = 'CM';
      if (centroId === 2) finalKey = 'AC';
      break;
    }
    case GcmContexts.AMMEDICAL: {
      finalKey = 'AM';
      break;
    }
    case GcmContexts.SANJUAN: {
      finalKey = 'SJ';
      break;
    }
    case GcmContexts.VALLEDUPAR: {
      finalKey = 'VDP';
      break;
    }
  }

  return (finalKey += `${key}`);
};
