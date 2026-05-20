export interface UltimoDiagnosticoRes {
  ingresoId: number;
  folioId: number;
  fecha: Date;
  codigo: string;
  descripcion: string;
  observaciones: string;
  documentoMedico: string;
  nombreMedico: string;
}

export const ultimoDiagnosticoPrincipalByIngresoIdQuery = (ingresoIds: number[]) => {
  return `
  WITH UltimoDiagnostico AS (
  SELECT
  I.OID ingresoId,
  F.OID folioId,
  F.HCFECFOL fecha,
  D.DIACODIGO codigo,
  D.DIANOMBRE descripcion,
  ISNULL(DP.HCPOBSERV, 'SIN OBSERVACIONES') observaciones,
  MD.USUNOMBRE documentoMedico,
  MD.USUDESCRI nombreMedico,
  ROW_NUMBER() OVER
  (PARTITION BY I.OID ORDER BY F.HCFECFOL DESC, F.OID DESC)
  AS rn
  FROM ADNINGRESO I
  INNER JOIN HCNFOLIO F ON F.ADNINGRESO = I.OID
  INNER JOIN HCNDIAPAC DP ON DP.HCNFOLIO = F.OID
  INNER JOIN GENDIAGNO D ON DP.GENDIAGNO = D.OID
  INNER JOIN GENUSUARIO MD ON F.GENMEDICO = MD.OID
  WHERE I.OID IN (${ingresoIds}) AND DP.HCPDIAPRIN = 1
)
SELECT
    ingresoId,
    folioId,
    fecha,
    codigo,
    descripcion,
    observaciones,
    documentoMedico,
    nombreMedico
FROM UltimoDiagnostico WHERE rn = 1`;
};
