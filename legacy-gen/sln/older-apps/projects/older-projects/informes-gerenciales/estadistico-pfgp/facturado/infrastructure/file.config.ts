import { GcmContexts } from '@common/application/constants';

export const contratosFacturadosConfig = (context: GcmContexts, inicio: Date) => {
  switch (context) {
    /******************************************************************************************** */
    /** ************************************* VALLEDUPAR **************************************** */
    /******************************************************************************************** */
    case GcmContexts.VALLEDUPAR: {
      return {
        codigosContratos: ['I202'],
        fusiones: [],
        excludeFromDeepSearchingFacturas: ['I202'],
        deepSearchingFacturasQ1: [],
        aliasFusiones: [],
      };
    }
    /******************************************************************************************** */
    /** ************************************** AGUACHICA **************************************** */
    /******************************************************************************************** */
    case GcmContexts.AGUACHICA: {
      const dateLimit_1 = new Date('2022-08-01:00:00');
      const dateLimit_2 = new Date('2023-02-01:00:00');

      if ((inicio as any) >= dateLimit_2) {
        return {
          codigosContratos: ['8006'],
          fusiones: [],
          excludeFromDeepSearchingFacturas: ['8006'],
          deepSearchingFacturasQ1: [],
          aliasFusiones: [],
        };
      } else if ((inicio as any) >= dateLimit_1) {
        return {
          codigosContratos: ['8000', '8001', '8002', '8003', '8004', '8005', '8006'],
          fusiones: [['8003', '8004']],
          excludeFromDeepSearchingFacturas: ['8000', '8001', '8002', '8004', '8005', '8006'],
          deepSearchingFacturasQ1: ['8003'],
          aliasFusiones: ['PGP ASMET SALUD SUBS - CONTR'],
        };
      } else {
        return {
          codigosContratos: ['8000', '8001', '8002', '8003', '8004', '8005', '8006'],
          fusiones: [['8003', '8004']],
          excludeFromDeepSearchingFacturas: ['8000', '8001', '8002', '8004', '8005', '8006'],
          deepSearchingFacturasQ1: ['8003'],
          aliasFusiones: ['PGP ASMET SALUD SUBS - CONTR'],
        };
      }
    }
    /******************************************************************************************** */
    /** ************************************** ALTACENTRO *************************************** */
    /******************************************************************************************** */
    case GcmContexts.ALTACENTRO: {
      const dateLimit_1 = new Date('2022-09-01:00:00');
      //const dateLimit_2 = new Date('2023-06-01:00:00');

      /*  if ((inicio as any) >= dateLimit_2) {
        return {
          codigosContratos: ['8013', '8018', '8019', '8020', '8021', '8022', '8023'],
          fusiones: [['8019', '8020']],
          excludeFromDeepSearchingFacturas: ['8013', '8018', '8020', '8021'],
          deepSearchingFacturasQ1: ['8019'],
          aliasFusiones: ['PGP ASMET SALUD EPS SAS'],
        };
      } else */ if ((inicio as any) >= dateLimit_1) {
        return {
          codigosContratos: ['8013', '8018', '8019', '8020', '8021', '8022', '8023'],
          fusiones: [['8019', '8020']],
          excludeFromDeepSearchingFacturas: ['8013', '8018', '8020', '8021', '8022', '8023'],
          deepSearchingFacturasQ1: ['8019'],
          aliasFusiones: ['PGP ASMET SALUD EPS SAS'],
        };
      } else if (inicio.getMonth() === 7) {
        return {
          codigosContratos: ['8005', '8006', '8010', '8018'],
          fusiones: [['8005', '8006']],
          excludeFromDeepSearchingFacturas: ['8006', '8010', '8018'],
          deepSearchingFacturasQ1: ['8005'],
          aliasFusiones: ['PGP ASMET SALUD SUBS - CONTR'],
        };
      } else {
        return {
          codigosContratos: ['8001', '8005', '8006', '8010'],
          fusiones: [['8005', '8006']],
          excludeFromDeepSearchingFacturas: ['8001', '8006', '8010'],
          deepSearchingFacturasQ1: ['8005'],
          aliasFusiones: ['PGP ASMET SALUD SUBS - CONTR'],
        };
      }
    }
    /******************************************************************************************** */
    /** *************************************** SANJUAN ***************************************** */
    /******************************************************************************************** */
    case GcmContexts.SANJUAN: {
      return;
    }
  }
};
