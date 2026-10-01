import { GcmContexts } from '@common/application/constants';

export const fetchAgrupadoresByConsecutivoQuery = (
  context: GcmContexts,
  codigosContratos: string[]
) => {
  let contratos = '';

  let colGCMAGRUPGP2 = 'GCMAGRUPGP2';

  if ([GcmContexts.VALLEDUPAR].indexOf(context) >= 0) colGCMAGRUPGP2 = 'GCMAGRUPGP';

  //const filterByCentro = idCentro ? `AND ADNINGRESO.ADNCENATE IN(${idCentro})` : '';

  codigosContratos.map((codigo, i) => {
    if (!i) contratos = `'${codigo}'`;
    else contratos = `${contratos}, '${codigo}'`;
  });

  return `
      SELECT  
        --ISNULL(G.ORDEN, 0) ORDEN,
           ISNULL(G.AGRUPADOR, 'EVENTOS') agrupador,
           --ADNINGRESO.AINCONSEC,
           SUM(SLNSERPRO.SERVALPRO * SLNSERPRO.SERCANTID) totalCargado
                FROM HPNESTANC
                INNER JOIN HPNDEFCAM ON HPNESTANC.HPNDEFCAM = HPNDEFCAM.OID
                INNER JOIN ADNINGRESO ADNINGRESO ON ADNINGRESO.OID = HPNESTANC.ADNINGRES
                INNER JOIN GENDETCON GENDETCON ON GENDETCON.OID = ADNINGRESO.GENDETCON
                LEFT JOIN SLNSERPRO ON SLNSERPRO.ADNINGRES1 = ADNINGRESO.OID
                LEFT JOIN SLNORDSER SLNORDSER ON SLNORDSER.OID = SLNSERPRO.SLNORDSER1
                LEFT JOIN SLNSERHOJ SLNSERHOJ ON SLNSERHOJ.OID = SLNSERPRO.OID
                LEFT JOIN GENSERIPS GENSERIPS ON GENSERIPS.OID = SLNSERHOJ.GENSERIPS1
                LEFT JOIN ${colGCMAGRUPGP2} G ON RTrim(LTrim(GENSERIPS.SIPCODIGO)) = G.COD_SERIPS
                AND G.CONTRATO IN (${contratos})
                WHERE 
                   ADNINGRESO.AINESTADO = 0 
                  AND SLNORDSER.SOSESTADO <> 2
                  AND HPNDEFCAM.HCAESTADO = 2
                  AND HPNESTANC.HESFECSAL IS NULL
                  AND GENDETCON.GDECODIGO IN (${contratos})
                  AND ADNINGRESO.AINCONSEC = @0
                GROUP BY ADNINGRESO.AINCONSEC, G.AGRUPADOR, G.ORDEN
                ORDER BY ADNINGRESO.AINCONSEC, G.ORDEN DESC;`;
};
