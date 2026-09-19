export type OrigenSolicitudCup = 'PQX' | 'NPQX' | 'EXA';

export const actualizarCupSolicitadoQuery = (origen: OrigenSolicitudCup) => {
  const tablas = { PQX: 'HCNSOLPQX', NPQX: 'HCNSOLPNQX', EXA: 'HCNSOLEXA' } as const;
  if (!Object.prototype.hasOwnProperty.call(tablas, origen)) {
    throw new Error('Origen de solicitud inválido');
  }
  return `
    UPDATE SOL SET GENSERIPS = @0
    FROM ${tablas[origen]} SOL
    INNER JOIN ADNINGRESO ING ON ING.OID = SOL.ADNINGRESO
    INNER JOIN HCNFOLIO FOL ON FOL.OID = SOL.HCNFOLIO
    WHERE SOL.OID = @1 AND ING.AINCONSEC = @2 AND FOL.HCNUMFOL = @3
      AND EXISTS (SELECT 1 FROM GENSERIPS WHERE OID = @0);
    SELECT @@ROWCOUNT AS afectados;
  `;
};
