export const findEpicrisisByConsecutivoQuery = (consecutivo: number) => {
  return `SELECT 
      A.AINCONSEC,
      E.HCECONSEC,
      E.HCEFECDOC,
      P.PACNUMDOC,
      P.PACEXPEDI,
      P.GPANOMCOM,
      M.GMENOMCOM,
      E.HCEESTDOC
      FROM HCNEPICRI E
      INNER JOIN ADNINGRESO A ON E.ADNINGRESO = A.OID
      INNER JOIN GENPACIEN P ON E.GENPACIEN = P.OID
      INNER JOIN GENMEDICO M ON E.GENMEDICO = M.OID
      WHERE E.HCECONSEC = ${consecutivo};`;
};
