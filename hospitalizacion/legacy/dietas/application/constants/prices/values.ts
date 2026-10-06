import { GcmContextType, GCM_CONTEXTS } from '@common/domain/types';

export const dietasValues = (context: GcmContextType) => {
  switch (context) {
    case GCM_CONTEXTS.ALTACENTRO:
      return {
        liquidos: { desayuno: 4000, almuerzo: 4000, cena: 4000 },
        solidos: { desayuno: 6466, almuerzo: 7100, cena: 6466 },
        familiar: { desayuno: 6466, almuerzo: 7100, cena: 6466 },
        merienda: { desayuno: 3784, almuerzo: 3784, cena: 3784 },
      };
    case GCM_CONTEXTS.AGUACHICA: {
      return {
        liquidos: { desayuno: 5000, almuerzo: 5000, cena: 5000 },
        solidos: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        familiar: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        merienda: { desayuno: 5000, almuerzo: 5000, cena: 5000 },
      };
    }
    case GCM_CONTEXTS.SANJUAN: {
      return {
        liquidos: { desayuno: 5000, almuerzo: 5000, cena: 5000 },
        solidos: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        familiar: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        merienda: { desayuno: 4000, almuerzo: 4000, cena: 4000 },
      };
    }
    case GCM_CONTEXTS.VALLEDUPAR: {
      return {
        liquidos: { desayuno: 5000, almuerzo: 5000, cena: 5000 },
        solidos: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        familiar: { desayuno: 8500, almuerzo: 8500, cena: 8500 },
        merienda: { desayuno: 5500, almuerzo: 5500, cena: 5500 },
      };
    }
  }
};
