export const fetchContratosQuery = (codigosContratos: string[], idCentro: number) => {
  let contratos = '';

  const filterByCentro = idCentro ? `AND ADNINGRESO.ADNCENATE IN(${idCentro})` : '';

  codigosContratos.map((codigo, i) => {
    if (!i) contratos = `'${codigo}'`;
    else contratos = `${contratos}, '${codigo}'`;
  });

  const str = `
      SELECT
      GENDETCON.GDECODIGO codigoContrato,
      GENDETCON.GDENOMBRE nombreContrato,
      SUM(SLNFACTUR.SFAVALCAR) totalEjecutado,
      SUM(SLNFACTUR.SFAVALREC) valorAnticipo,
      ISNULL(G.LIMITE, 0) totalContratado,
      COUNT(SLNFACTUR.SFATOTFAC) iteraciones,
      ISNULL((G.LIMITE - SUM(SLNFACTUR.SFAVALCAR)), 0) errorAbsoluto,
      ISNULL(((G.LIMITE - SUM(SLNFACTUR.SFAVALCAR)) / G.LIMITE)*100, 0) errorRelativo,
      ISNULL(ROUND(((SUM(SLNFACTUR.SFAVALCAR) / G.LIMITE)*100), 2),0) porcentajeEjecutado
    FROM SLNFACTUR SLNFACTUR
      INNER JOIN ADNINGRESO ON ADNINGRESO.OID = SLNFACTUR.ADNINGRESO
      INNER JOIN GENDETCON ON GENDETCON.OID = SLNFACTUR.GENDETCON
      LEFT JOIN HPNDEFCAM E ON ADNINGRESO.HPNDEFCAM = E.OID
      LEFT JOIN HPNSUBGRU F ON F.OID = E.HPNSUBGRU
      LEFT JOIN GCMLIMPGP G ON G.GDECODIGO = GENDETCON.GDECODIGO
    WHERE CONVERT(DATE, SLNFACTUR.SFAFECFAC, 103) BETWEEN @0 AND @1
      AND  SLNFACTUR.SFADOCANU = 0
      AND SLNFACTUR.SFATIPDOC = 17
      AND GENDETCON.GDECODIGO IN(${contratos}) AND ADNINGRESO.ADNCENATE IS NOT NULL ${filterByCentro}
      GROUP BY GENDETCON.GDECODIGO, GENDETCON.GDENOMBRE, G.LIMITE;`;

  return str;
};
