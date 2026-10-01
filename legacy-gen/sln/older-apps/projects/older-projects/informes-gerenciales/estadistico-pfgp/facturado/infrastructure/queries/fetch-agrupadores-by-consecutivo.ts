import { GcmContexts } from '@common/application/constants';

export const fetchAgrupadoresByConsecutivoQuery = (
  context: GcmContexts,
  idCentro: number,
  codigosContratos: string[]
) => {
  let contratos = '';

  let colGCMAGRUPGP = 'GCMAGRUPGP';

  if ([GcmContexts.ALTACENTRO].indexOf(context) >= 0) colGCMAGRUPGP = 'GCMAGRUPGP2';

  codigosContratos.map((codigo, i) => {
    if (!i) contratos = `'${codigo}'`;
    else contratos = `${contratos}, '${codigo}'`;
  });

  const filterByCentro = idCentro ? `AND ADNINGRESO.ADNCENATE IN(${idCentro})` : '';

  const str = `
      SELECT 
          ISNULL(G.AGRUPADOR, 'EVENTOS') nombreAgrupador,
          SUM(SLNSERPRO.SERCANTID * (SLNSERPRO.SERVALENT + SLNSERPRO.SERVALPAC)) totalEjecutado
         FROM SLNFACTUR SLNFACTUR
          INNER JOIN ADNINGRESO ADNINGRESO ON ADNINGRESO.OID = SLNFACTUR.ADNINGRESO
          INNER JOIN GENDETCON GENDETCON ON GENDETCON.OID = SLNFACTUR.GENDETCON
          INNER JOIN SLNSERPRO SLNSERPRO ON SLNSERPRO.ADNINGRES1 = ADNINGRESO.OID
          INNER JOIN SLNORDSER SLNORDSER ON SLNORDSER.OID = SLNSERPRO.SLNORDSER1
          LEFT JOIN SLNSERHOJ SLNSERHOJ ON SLNSERHOJ.OID = SLNSERPRO.OID
          LEFT JOIN GENSERIPS GENSERIPS ON GENSERIPS.OID = SLNSERHOJ.GENSERIPS1
          LEFT JOIN ${colGCMAGRUPGP} G ON RTrim(LTrim(GENSERIPS.SIPCODIGO)) = G.COD_SERIPS
         AND G.CONTRATO IN (${contratos})
        WHERE 
         SLNFACTUR.SFATIPDOC = 17
         AND SLNFACTUR.SFADOCANU = 0
         AND CONVERT(DATE, SLNFACTUR.SFAFECFAC, 103) BETWEEN @0 AND @1
         AND GENDETCON.GDECODIGO IN (${contratos})
         AND ADNINGRESO.ADNCENATE IS NOT NULL ${filterByCentro}
         AND SLNORDSER.SOSESTADO = 1
         AND ADNINGRESO.AINCONSEC = @2
         GROUP BY 
         ADNINGRESO.AINCONSEC, G.AGRUPADOR, G.ORDEN
         ORDER BY ADNINGRESO.AINCONSEC, G.ORDEN DESC;
      `;

  return str;
};
