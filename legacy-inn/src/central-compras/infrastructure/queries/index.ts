export * from './cxp.queries';
export * from './fetch-items.queries';

export interface UltimoCambioEstadoBySolicitudI {
  solicitudId: number;
  fechaCreacion: Date;
}

export const ultimosCambiosEstadosBySolicitudQr = (solicitudesIds: number[]) => {
  return `WITH RankedData AS (SELECT EKINNCTCSOLI solicitudId, CREATEDAT fechaCreacion,
  ROW_NUMBER() OVER (PARTITION BY EKINNCTCSOLI ORDER BY OID DESC)
  as RowNum FROM EKINNCTCESTA WHERE EKINNCTCSOLI IN(${solicitudesIds}))
  SELECT * FROM RankedData WHERE RowNum = 1;`;
};
