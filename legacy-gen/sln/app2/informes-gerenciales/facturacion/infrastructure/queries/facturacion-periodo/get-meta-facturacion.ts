export const getMetaFacturacionQuery = (fecha: Date, centros: number[]) => {
  const fechaFormated = fecha.toISOString().split('T')[0];

  return `SELECT 
      SUM(CASE MONTH('${fechaFormated}')
      WHEN 1 THEN CENPROENE
      WHEN 2 THEN CENPROFEB
      WHEN 3 THEN CENPROMAR
      WHEN 4 THEN CENPROABR
      WHEN 5 THEN CENPROMAY
      WHEN 6 THEN CENPROJUN
      WHEN 7 THEN CENPROJUL
      WHEN 8 THEN CENPROAGO
      WHEN 9 THEN CENPROSEP
      WHEN 10 THEN CENPROOCT
      WHEN 11 THEN CENPRONOV
      WHEN 12 THEN CENPRODIC
      ELSE 0 END) META
      FROM GCMCENATEPRO
      WHERE PERIODO = YEAR('${fechaFormated}')
      AND ADNCENATE IN(${centros})`;
};
