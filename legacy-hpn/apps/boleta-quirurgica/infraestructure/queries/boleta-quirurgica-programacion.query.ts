export const boletaQuirurgicaProgramacionQuery = () => `
    SELECT * FROM GCMCIRDERINTRAHOSPPRO WHERE INGRESO = @0 AND FOLIO = @1
`;
