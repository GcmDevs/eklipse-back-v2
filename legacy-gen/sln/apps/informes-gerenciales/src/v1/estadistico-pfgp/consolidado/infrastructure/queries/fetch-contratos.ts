export const fetchContratosQuery = (codigosContratos: string[], idCentro: number) => {
  const filterByCentro = idCentro ? `AND ADNINGRESO.ADNCENATE IN(${idCentro})` : '';

  let contratos = '';

  codigosContratos.map((codigo, i) => {
    if (!i) contratos = `'${codigo}'`;
    else contratos = `${contratos}, '${codigo}'`;
  });

  return `
      SELECT 
      CONS.NContrato codigoContrato,
      CONS.Contrato nombreContrato,
      SUM(CONS.TotalEjecutado) totalEjecutado,
      MAX(CONS.TotalFacturado) totalContratado,
      SUM(CONS.Iteraciones) iteraciones,
      ISNULL(ROUND ( MAX(CONS.TotalFacturado)-SUM(CONS.TotalEjecutado), 2 ),0) errorAbsoluto,
      ((MAX(CONS.TotalFacturado)-SUM(CONS.TotalEjecutado))/NULLIF(MAX(CONS.TotalFacturado), 0))*100 errorRelativo,
      ((SUM(CONS.TotalEjecutado) / NULLIF(MAX(CONS.TotalFacturado),0))*100) porcentajeEjecutado
      FROM GENDETCON
      RIGHT JOIN(
      SELECT   
        'ACOST' ESTADO,
        GENDETCON.GDECODIGO As NContrato,
        GENDETCON.GDENOMBRE As Contrato,
        COUNT(DISTINCT(ADNINGRESO.AINCONSEC)) Iteraciones,
        SUM(SLNSERPRO.SERCANTID * SLNSERPRO.SERVALPRO) TotalEjecutado,
        ISNULL(G.LIMITE, 0) TotalFacturado
      FROM HPNESTANC
        INNER JOIN HPNDEFCAM ON HPNESTANC.HPNDEFCAM = HPNDEFCAM.OID
          INNER JOIN ADNINGRESO ON HPNESTANC.ADNINGRES = ADNINGRESO.OID
          INNER JOIN GENPACIEN ON ADNINGRESO.GENPACIEN = GENPACIEN.OID
          INNER JOIN GENDETCON ON ADNINGRESO.GENDETCON = GENDETCON.OID
          LEFT JOIN SLNSERPRO ON SLNSERPRO.ADNINGRES1 = ADNINGRESO.OID
          LEFT Join SLNORDSER On SLNORDSER.OID = SLNSERPRO.SLNORDSER1
          LEFT JOIN GCMLIMPGP G ON GENDETCON.GDECODIGO = G.GDECODIGO
        WHERE GENDETCON.GDECODIGO IN(${contratos})
          AND ADNINGRESO.AINESTADO = 0 
          AND SLNORDSER.SOSESTADO <> 2
          AND HPNDEFCAM.HCAESTADO = 2
          AND ADNINGRESO.ADNCENATE IS NOT NULL ${filterByCentro}
          AND HPNESTANC.HESFECSAL IS NULL
        GROUP BY GENDETCON.GDECODIGO, GENDETCON.GDENOMBRE, G.LIMITE
        UNION
      Select
        'FACT' ESTADO,
        GENDETCON.GDECODIGO As NContrato,
        GENDETCON.GDENOMBRE As Contrato,
        COUNT(SLNFACTUR.SFATOTFAC) Iteraciones,
        SUM(SLNFACTUR.SFAVALCAR) TotalEjecutado,
        ISNULL(G.LIMITE, 0) TotalFacturado
      From SLNFACTUR SLNFACTUR
        Inner Join ADNINGRESO ADNINGRESO On ADNINGRESO.OID = SLNFACTUR.ADNINGRESO
        Inner Join GENDETCON GENDETCON On GENDETCON.OID = SLNFACTUR.GENDETCON
        LEFT JOIN HPNDEFCAM E ON ADNINGRESO.HPNDEFCAM = E.OID
        LEFT JOIN HPNSUBGRU F ON F.OID = E.HPNSUBGRU
        LEFT JOIN GCMLIMPGP G ON G.GDECODIGO = GENDETCON.GDECODIGO
      Where CONVERT(DATE, SLNFACTUR.SFAFECFAC, 103) Between @0 And @1
        AND  SLNFACTUR.SFADOCANU = 0
        AND ADNINGRESO.ADNCENATE IS NOT NULL ${filterByCentro}
        and SLNFACTUR.SFATIPDOC = 17
        AND GENDETCON.GDECODIGO IN(${contratos})
      GROUP BY GENDETCON.GDECODIGO, GENDETCON.GDENOMBRE, G.LIMITE)AS CONS ON CONS.NContrato = GENDETCON.GDECODIGO
      GROUP BY CONS.NContrato, CONS.Contrato
      ORDER BY CONS.NContrato;`;
};
