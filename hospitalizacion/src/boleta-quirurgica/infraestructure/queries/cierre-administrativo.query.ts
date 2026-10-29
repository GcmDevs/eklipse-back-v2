export const cierreAdministrativoQuery = () => `
  UPDATE GCMCIRDERINTRAHOSP SET ESTADO = 'CERRADO'
  WHERE INGRESO = @0 AND FOLIO = @1;
  SELECT @@ROWCOUNT AS afectados;
`;
