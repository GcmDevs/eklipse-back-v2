export const getAutorizadosQuery = () => `
    SELECT * FROM GCMCIRDERINTRAHOSPCUPS WHERE INGRESO = @0 AND FOLIO = @1
`;

// response ---> ingreso codigo, nombre, folio
