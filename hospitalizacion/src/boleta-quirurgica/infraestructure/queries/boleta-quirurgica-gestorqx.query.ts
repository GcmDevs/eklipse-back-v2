export const boletaQuirurgicaGestorQxQuery = () => `
    SELECT * FROM GCMCIRDERINTRAHOSPGESTORQ WHERE INGRESO = @0 AND FOLIO = @1
`;
