import { GcmContexts } from '@common/application/constants';

export const contratosAcostadosConfig = (context: GcmContexts, inicio: Date) => {
  switch (context) {
    case GcmContexts.VALLEDUPAR: {
      return {
        codigosContratos: ['I202'],
        fusiones: [],
        aliasFusiones: [],
      };
    }
    case GcmContexts.AGUACHICA: {
      return {
        codigosContratos: ['8000', '8001', '8002', '8003', '8004', '8005', '8006'],
        fusiones: [['8003', '8004']],
        aliasFusiones: ['PGP ASMET SALUD SUBS - CONTR'],
      };
    }
    case GcmContexts.ALTACENTRO: {
      return {
        codigosContratos: ['8018', '8019', '8020', '8021', '8022', '8023'],
        fusiones: [],
        aliasFusiones: [],
      };
    }
    case GcmContexts.SANJUAN: {
      return;
    }
  }
};
