type Fuente = 'HCNSOLPNQX' | 'HCNSOLEXA' | 'HCNSOLPQX';

const solicitud = (tabla: Fuente, origen: string, grupo?: number, requerimiento = false) => `
  SELECT ADNINGRESO.AINCONSEC AS INGRESO, SOL.OID,
    GENSERIPS.SIPCODIGO AS CODIGO_INTERNO,
    GENSERIPS.SIPCODCUP AS CODIGO_CUPS,
    GENSERIPS.SIPDESCUP AS DESCRIPCION,
    SOL.HCSOBSERV AS OBSERVACION, SOL.HCSCANTI AS CANTIDAD,
    ${requerimiento ? 'SOL.HCNREQUERI' : "''"} AS REQUERIMIENTO,
    SOL.HCSFECSOL AS FECHA_SOLICITUD,
    CASE SOL.HCSESTADO
      WHEN 0 THEN 'URGENTE' WHEN 1 THEN 'RUTINARIO' WHEN 2 THEN 'ELECTIVA'
      WHEN 3 THEN 'PRIORITARIA' WHEN 4 THEN 'MUY URGENTE'
      WHEN 5 THEN 'CONTROL' WHEN 6 THEN 'PROGRAMADO'
    END AS PRIORIDAD,
    '${origen}' AS ORIGEN
  FROM ${tabla} SOL
  INNER JOIN ADNINGRESO ON SOL.ADNINGRESO = ADNINGRESO.OID
  INNER JOIN GENSERIPS ON SOL.GENSERIPS = GENSERIPS.OID
  INNER JOIN HCNFOLIO ON HCNFOLIO.OID = SOL.HCNFOLIO
  WHERE ADNINGRESO.AINCONSEC = @0 AND HCNFOLIO.HCNUMFOL = @1
    ${grupo === undefined ? '' : `AND GENSERIPS.GENGRUPOS1 = ${grupo}`}
`;

export const cupsSolicitadosQuery = (tipo: string | null | undefined) => {
  switch ((tipo ?? '').trim().toUpperCase()) {
    case 'HEMODINAMIA':
      return [
        solicitud('HCNSOLPNQX', 'NPQX'),
        solicitud('HCNSOLEXA', 'EXA', 13),
        solicitud('HCNSOLPQX', 'PQX'),
      ].join(' UNION ALL ');
    case 'GASTRO':
      return [solicitud('HCNSOLPNQX', 'NPQX', 25), solicitud('HCNSOLPQX', 'PQX')].join(
        ' UNION ALL '
      );
    default:
      return solicitud('HCNSOLPQX', 'PQX', undefined, true);
  }
};
