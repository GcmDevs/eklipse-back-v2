export const fetchEstanciasByConsecutivoQuery = () => {
  return `
      SELECT
      A.AINCONSEC ingreso, 
      H.HESFECING fechaIngreso,
      H.HESFECSAL fechaSalida, 
      HCANOMBRE nombreCama,
      HD.HCACODIGO codigoCama 
      FROM HPNESTANC H
      INNER JOIN ADNINGRESO A ON A.OID = H.ADNINGRES
      INNER JOIN HPNDEFCAM HD ON HD.OID = H.HPNDEFCAM
      WHERE A.AINCONSEC = @0;`;
};
