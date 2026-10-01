import { getPrecioDietaAltaCentro } from './altacentro';
import { getPrecioDietaValledupar } from './valledupar';
import { getPrecioDietaAguachica } from './aguachica';
import { getPrecioDietaSanJuan } from './san-juan';
import { GCM_CONTEXTS } from '@common/domain/types';
import { DataDieFPI } from './common';

export const getPrecioDieta = (payload: DataDieFPI) => {
  switch (payload.context) {
    case GCM_CONTEXTS.ALTACENTRO:
      return getPrecioDietaAltaCentro(payload);
    case GCM_CONTEXTS.VALLEDUPAR:
      return getPrecioDietaValledupar(payload);
    case GCM_CONTEXTS.SANJUAN:
      return getPrecioDietaSanJuan(payload);
    case GCM_CONTEXTS.AGUACHICA:
      return getPrecioDietaAguachica(payload);
  }
};
