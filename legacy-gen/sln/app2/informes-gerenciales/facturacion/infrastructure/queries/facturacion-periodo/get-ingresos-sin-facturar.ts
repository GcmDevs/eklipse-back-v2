export const getIngresosSinFacturar = (anteriores: boolean) => {
  return `SELECT
      I.ADNCENATE idCentroAtencion,
      CONVERT(DATE,I.AINFECING) fechaIngreso,
      ISNULL((SELECT SUM(SLNCONHOJ.SCOTOTENT)FROM SLNCONHOJ WHERE SLNCONHOJ.ADNINGRES1 = I.OID),0) AS [total],
      I.AINURGCON ingresoPor,
      I.AINESTADO estadoIngreso
      FROM ADNINGRESO I INNER JOIN GENPACIEN P ON P.OID = I.GENPACIEN
      WHERE CONVERT(DATE,I.AINFECING) ${
        anteriores ? '< @0' : 'BETWEEN @0 AND @1'
      } AND I.ADNEGRESO IS NULL
      AND (I.AINESTADO = 0 OR I.AINESTADO = 3)`;
};
