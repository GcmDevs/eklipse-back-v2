export interface PacienteHospitalizadoI {
  pacienteId: number;
  ingresoId: number;
  consecutivoIngreso: number;
  nombreCompletoPaciente: string;
  cedulaPaciente: string;
  codigoCama: string;
  codigoSubgrupo: string;
  nombreSubgrupo: string;
  centroId: number;
  tieneSuministrosPorEntregar: boolean;
}

export const pacientesHospitalizadosQuery = () => {
  return `SELECT P.OID pacienteId,
  I.AINCONSEC consecutivoIngreso,
  I.OID ingresoId,
  P.GPANOMCOM nombreCompletoPaciente,
  P.PACNUMDOC cedulaPaciente,
  C.HCACODIGO codigoCama,
  SG.HSUCODIGO codigoSubgrupo,
  SG.HSUNOMBRE nombreSubgrupo,
  I.ADNCENATE centroId
  FROM HPNESTANC E INNER JOIN ADNINGRESO I ON E.ADNINGRES = I.OID
  INNER JOIN GENPACIEN P ON I.GENPACIEN = P.OID
  INNER JOIN HPNDEFCAM C ON I.HPNDEFCAM = C.OID
  INNER JOIN HPNSUBGRU SG ON C.HPNSUBGRU = SG.OID
  WHERE E.HESFECSAL IS NULL AND E.ADNINGRES IS NOT NULL
  AND (C.HCAESTADO < 3) AND I.AINURGCON <> 1`;
};
