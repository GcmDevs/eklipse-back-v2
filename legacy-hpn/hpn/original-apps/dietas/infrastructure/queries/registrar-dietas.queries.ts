export const validateIfJornadaPorSubgrupoExistQuery = (
  fecha: string,
  subgrupoId: number,
  horarioId: number
) => {
  return `
  SELECT G.OID FROM PDYDIEGRU G
  INNER JOIN PDYDIEJOR J ON G.OID = G.PDYDIEJOR
  WHERE J.DIEFECJOR = '${fecha}'
  AND J.DIEHORARIO = ${horarioId}
  AND G.HPNSUBGRU = ${subgrupoId}
`;
};

export const fetchCamasRegistradasEnJornadaQuery = (
  fecha: Date,
  horarioId: number,
  camas: number[],
  pacientes: number[]
) => {
  return `SELECT D.OID id, C.OID camaId, P.OID pacienteId, P.GPANOMCOM nombrePaciente
        FROM PDYDIEEST D
        INNER JOIN PDYDIEGRU G ON G.OID = D.PDYDIEGRU
        INNER JOIN PDYDIEJOR J ON J.OID = G.PDYDIEJOR
        INNER JOIN HPNDEFCAM C ON C.OID = D.HPNDEFCAM 
        INNER JOIN GENPACIEN P ON P.OID = D.GENPACIEN
      WHERE J.DIEFECJOR = '${fecha}' AND J.DIEHORARIO = ${horarioId}
      AND D.ELIMINADO = 0
      AND (C.OID IN(${camas})
      OR P.OID IN(${pacientes}))`;
};
