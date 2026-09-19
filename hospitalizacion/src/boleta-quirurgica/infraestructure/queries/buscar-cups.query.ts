export const buscarCupsQuery = () => `
  SELECT OID, SIPCODIGO,
    CASE SIPTIPSER
      WHEN 1 THEN 'No_Quirurgico'
      WHEN 2 THEN 'Quirurgico'
      WHEN 3 THEN 'Quirurgico'
    END AS TIPO,
    SIPNOMBRE AS NOMBRE
  FROM GENSERIPS
  WHERE SIPCODIGO LIKE @0
`;
