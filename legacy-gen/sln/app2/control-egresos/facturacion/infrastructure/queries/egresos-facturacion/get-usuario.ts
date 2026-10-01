export const getUsuarioQuery = () => {
  return `

    SELECT USUNOMBRE,USUDESCRI
    FROM GENUSUARIO
    WHERE OID = @0
`;
};
