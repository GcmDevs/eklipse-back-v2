export interface FetchPagoCXPI {
  id: number;
  totalAPagar: number;
  naturaleza: 1 | 2;
}

export const fetchPagosCXPQr = (consecutivoCXP: string) => {
  return `SELECT
  CP.OID id,
  DTCP.DETVALOR totalAPagar,
  DTCP.DETNATURA naturaleza
  from PGNCXP CP
  INNER JOIN PGNCXPDETALLE DTCP ON DTCP.PGNCXP= CP.OID
  WHERE CP.CXPDOCUME = '${consecutivoCXP}'`;
};
