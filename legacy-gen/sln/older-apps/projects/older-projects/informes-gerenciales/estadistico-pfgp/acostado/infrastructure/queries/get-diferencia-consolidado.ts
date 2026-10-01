export const getDiferenciaConsolidadoQuery = (idCentro: number, codigosContratos: string[]) => {
  let contratos = '';

  codigosContratos.map((codigo, i) => {
    if (!i) contratos = `'${codigo}'`;
    else contratos = `${contratos}, '${codigo}'`;
  });

  const filterByCentroINGRESO = idCentro ? `AND ADNINGRESO.ADNCENATE IN(${idCentro})` : '';
  const filterByCentroCAMA = idCentro ? `AND HPNDEFCAM.ADNCENATE IN(${idCentro})` : '';

  return `
      SELECT 
      NContrato codigoContrato,
      CONS.ErrorAbsoluto disponibilidad
      FROM 
      GENDETCON RIGHT JOIN(
      SELECT 
      CONS.NContrato,
      CONS.Contrato,
      SUM(CONS.TotalEjecutado) TotalEjecutado,
      MAX(CONS.TotalFacturado) TotalFacturado,
      SUM(CONS.Iteraciones) Iteraciones,
      ISNULL(ROUND ( MAX(CONS.TotalFacturado)-SUM(CONS.TotalEjecutado), 2 ),0) ErrorAbsoluto,
      ROUND( ((MAX(CONS.TotalFacturado)-SUM(CONS.TotalEjecutado))/NULLIF(MAX(CONS.TotalFacturado), 0))*100,2) ErrorRelativo,
      ROUND(((SUM(CONS.TotalEjecutado) / NULLIF(MAX(CONS.TotalFacturado),0))*100), 2) Porcentaje
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
        WHERE GENDETCON.GDECODIGO IN (${contratos})
          AND ADNINGRESO.AINESTADO = 0 
          AND SLNORDSER.SOSESTADO <> 2
          AND HPNDEFCAM.HCAESTADO = 2
          AND HPNESTANC.HESFECSAL IS NULL
          AND HPNDEFCAM.ADNCENATE IS NOT NULL ${filterByCentroCAMA}
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
      Where CONVERT(DATE,SLNFACTUR.SFAFECFAC, 103) Between @0 And @1
        AND  SLNFACTUR.SFADOCANU = 0
        and SLNFACTUR.SFATIPDOC = 17
        AND GENDETCON.GDECODIGO IN(${contratos})
		AND ADNINGRESO.ADNCENATE IS NOT NULL ${filterByCentroINGRESO}
      GROUP BY GENDETCON.GDECODIGO, GENDETCON.GDENOMBRE, G.LIMITE)AS CONS ON CONS.NContrato = GENDETCON.GDECODIGO
      GROUP BY CONS.NContrato, CONS.Contrato)CONS ON CONS.NContrato = GENDETCON.GDECODIGO 
      WHERE GENDETCON.GDECODIGO IN(${contratos})
      ORDER BY CONS.nContrato;`;
};
