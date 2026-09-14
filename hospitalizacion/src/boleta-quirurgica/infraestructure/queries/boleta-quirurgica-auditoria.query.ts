export const boletaQuirurgicaAuditoriaQuery = () => `
    SELECT * FROM GCMCIRDERINTRAHOSPAUD WHERE INGRESO = @0 AND FOLIO = @1
`;
