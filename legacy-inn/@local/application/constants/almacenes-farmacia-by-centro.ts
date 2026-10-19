import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

export const almacenesFarmaciaIdsByCtx = (ctx: GcmContextType) => {
  switch (ctx) {
    case GCM_CONTEXTS.ALTACENTRO:
      return [2, 39, 101, 105, 106, 153, 155];
    case GCM_CONTEXTS.AGUACHICA:
      return [2];
    case GCM_CONTEXTS.AMMEDICAL:
      return [1];
    case GCM_CONTEXTS.SANJUAN:
      return [29];
    case GCM_CONTEXTS.VALLEDUPAR:
      return [1];
  }
};
