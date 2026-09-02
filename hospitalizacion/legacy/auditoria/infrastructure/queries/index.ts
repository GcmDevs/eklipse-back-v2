export const diagnosticosByIngresoQuery = (ingreso: number) => {
  return `SELECT D.OID id, D.DIACODIGO codigo, D.DIANOMBRE nombre,
F.OID folio, F.HCFECFOL fecha, DP.HCPDIAPRIN esPrincipal,
ISNULL(DP.HCPOBSERV, 'SIN OBSERVACIONES') observaciones,
MD.USUNOMBRE documentoMedico,
MD.USUDESCRI nombreMedico
FROM ADNINGRESO I
INNER JOIN HCNFOLIO F ON F.ADNINGRESO = I.OID
INNER JOIN HCNDIAPAC DP ON DP.HCNFOLIO = F.OID
INNER JOIN GENDIAGNO D ON DP.GENDIAGNO = D.OID
INNER JOIN GENUSUARIO MD ON F.GENMEDICO = MD.OID
WHERE I.OID = ${ingreso} ORDER BY F.HCFECFOL DESC`;
};

export const diagnosticosByIdsQuery = (ids: number[]) => {
  return `SELECT D.OID id, D.DIACODIGO codigo, D.DIANOMBRE nombre
  from GENDIAGNO D WHERE D.OID IN(${ids})`;
};

export const serviciosByIdsQuery = (ids: number[]) => {
  return `SELECT D.OID id, D.SIPCODIGO codigo, D.SIPNOMBRE nombre
  from GENSERIPS D WHERE D.OID IN(${ids})`;
};

export const procedimientosByIngresoQuery = (ingreso: number) => {
  return `SELECT
	N26.OID as id,
	N18.SERDESSER AS nombre
	FROM ADNINGRESO N1 
	LEFT JOIN SLNFACTUR N0 ON (N1.OID = N0.ADNINGRESO) 
	LEFT JOIN GENDETCON N2 ON (N1.GENDETCON = N2.OID) 
	LEFT JOIN ADNCENATE N3 ON (N1.ADNCENATE = N3.OID) 
	LEFT JOIN GENCONTRA N4 ON (N2.GENCONTRA1 = N4.OID) 
	LEFT join SLNSERPRO N18 on (N1.OID = N18.ADNINGRES1) 
	LEFT JOIN SLNORDSER N19 on (N18.SLNORDSER1 = N19.OID) 
	LEFT JOIN SLNPROHOJ N21 on (N18.OID = N21.OID) 
	LEFT JOIN INNPRODUC N22 on (N21.INNPRODUC1 = N22.OID) 
	LEFT JOIN SLNSERHOJ N25 on (N18.OID = N25.OID) 
	LEFT JOIN GENSERIPS N26 on (N25.GENSERIPS1 = N26.OID) 
WHERE N1.OID = ${ingreso} AND ( (N0.SFADOCANU IS NULL) OR (N0.SFADOCANU = 0)) AND (N19.SOSESTADO <> 2) AND N1.AINESTADO <> 2 AND N26.GENCONFAC1 IN(16,4)
ORDER BY N1.OID, N18.SERFECSER DESC`;
};

export interface EstanciaByPaciente {
  id: number;
  isEstanciaActual: boolean;
  consecutivo: string;
  numeroDocumento: string;
  fechaIngreso: Date;
  fechaEgreso: Date;
  totalDias: number;
  idGrupo: number;
  nombreGrupo: string;
  codigoCama: string;
  tieneInternaciones: boolean;
  internaciones: any[];
}

export const estanciasByConsecutivos = (consecutivosIds: number[]) => {
  return `
	SELECT
      H.OID id,
	  P.PACNUMDOC numeroDocumento,
      A.AINCONSEC consecutivo,
      H.HESFECING fechaIngreso,
      H.HESFECSAL fechaEgreso,
      SG.HSUNOMBRE nombreSubgrupo,
      HD.HCACODIGO codigoCama,
    DATEDIFF(DAY, H.HESFECING, ISNULL(H.HESFECSAL, GETDATE())) totalDias
      FROM HPNESTANC H
      INNER JOIN ADNINGRESO A ON A.OID = H.ADNINGRES
      INNER JOIN GENPACIEN P ON P.OID = A.GENPACIEN
      INNER JOIN HPNDEFCAM HD ON HD.OID = H.HPNDEFCAM
      INNER JOIN HPNSUBGRU SG ON SG.OID = HD.HPNSUBGRU
      WHERE A.AINCONSEC IN(${consecutivosIds})
      AND A.AINESTADO IN(0,1)
      AND (DateDiff(HOUR, A.AINFECING, A.AINFECEGRE) > 6 OR A.AINFECFAC IS NULL)`;
};
/* 
export const procedimientosByIngresoQuery = (ingreso: number) => {
  return `SELECT
	N18.OID as id,
	N18.SERDESSER AS nombre
FROM ADNINGRESO N1 
	LEFT JOIN SLNFACTUR N0 ON (N1.OID = N0.ADNINGRESO) 
	LEFT JOIN GENDETCON N2 ON (N1.GENDETCON = N2.OID) 
	LEFT JOIN ADNCENATE N3 ON (N1.ADNCENATE = N3.OID) 
	LEFT JOIN GENCONTRA N4 ON (N2.GENCONTRA1 = N4.OID) 
	LEFT join SLNSERPRO N18 ON (N1.OID = N18.ADNINGRES1) 
	LEFT JOIN SLNORDSER N19 ON (N18.SLNORDSER1 = N19.OID) 
	LEFT JOIN SLNPROHOJ N21 ON (N18.OID = N21.OID) 
	LEFT JOIN INNPRODUC N22 ON (N21.INNPRODUC1 = N22.OID) 
	LEFT JOIN SLNSERHOJ N25 ON (N18.OID = N25.OID) 
	LEFT JOIN GENSERIPS N26 ON (N25.GENSERIPS1 = N26.OID) 
WHERE N1.OID = ${ingreso} AND ( (N0.SFADOCANU IS NULL) OR (N0.SFADOCANU = 0))
AND (N19.SOSESTADO <> 2) AND N1.AINESTADO <> 2 
ORDER BY N1.OID, N18.SERFECSER DESC`;
};
 */
