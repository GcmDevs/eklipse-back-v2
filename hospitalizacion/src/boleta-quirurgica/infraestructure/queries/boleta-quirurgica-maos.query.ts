export const boletaQuirurgicaMaosQuery = () => `
    SELECT * FROM GCMCIRDERINTRAHOSPGES WHERE INGRESO = @0 AND FOLIO = @1
`;
