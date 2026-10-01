import { DieEstadoCode, OFERTA } from '@hpn/ori/die/domain/types/local';
import { DetalleOfertaI, OfertaI } from '../data-transfers';
import { orderBy } from 'lodash';
import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';

export interface DietaI {
  id: number;
  dieCentroId: number;
  dieJornadaId: number;
  dieSubgrupoId: number;
  centroId: number;
  subgrupoId: number;
  config: string;
  observacion: string;
  estadoCode: DieEstadoCode;
  horarioId: number;
  fecha: Date;
  camaId: number;
  pacienteId: number;
  enAislamiento: boolean;
}

export interface FetchPacientesBySubgrupoI {
  CAMAID: number;
  HCACODIGO: string;
  HPNDEFCAM: number;
  GPANOMPAC: string;
  GPAFECNAC: Date;
  GENPACIEN: number;
  HCSFECFOL: Date;
  DIEGRUTIP: string;
  DIEGRUCON: string;
  DIEGRUOBS: string;
  GEEDESCRI: string;
  GMENOMCOM: string;
}

export interface PacienteAcostadoI {
  cama: {
    id: number;
    codigo: string;
  };
  paciente: {
    id: number;
    nombreCompleto: string;
    fechaNacimiento: Date;
  };
  folio: {
    fecha: Date | null;
    medico: {
      especialidad: {
        nombre: string;
      };
      nombreCompleto: string;
    };
  };
  dieta: {
    id: number | null;
    tipos: DetalleOfertaI[];
    consistencias: DetalleOfertaI[];
    extraordinarias: DetalleOfertaI[];
    observacion: string;
    ultimaObservacion: string | null;
    enAislamiento: boolean;
  };
  camaId: number;
}

export const dietasPedidasArgumentQuery = () => `
D.OID id,
C.OID dieCentroId,
J.OID dieJornadaId,
G.OID dieSubgrupoId,
C.ADNCENATE centroId,
SG.OID subgrupoId,
D.DIECONFIG config,
D.DIEGRUOBS observacion,
D.DIEESTADO estadoCode,
J.DIEHORARIO horarioId,
J.DIEFECJOR fecha,
D.GENPACIEN pacienteId,
D.HPNDEFCAM camaId,
D.ENAISLAMIENTO enAislamiento
FROM PDYDIEEST D
INNER JOIN PDYDIEGRU G ON G.OID = D.PDYDIEGRU
INNER JOIN HPNSUBGRU SG ON SG.OID = G.HPNSUBGRU
INNER JOIN PDYDIEJOR J ON J.OID = G.PDYDIEJOR
INNER JOIN PDYDIECEN C ON C.OID = J.PDYDIECEN`;

export const refactorizeDietaCodeToConfig = (ofertas: OfertaI[], config: string) => {
  const tipos: DetalleOfertaI[] = [];
  const consistencias: DetalleOfertaI[] = [];
  const extraordinarias: DetalleOfertaI[] = [];

  const codes = config.split('|');

  ofertas.forEach(of => {
    const rowsOrdered = orderBy(of.rows, 'code', 'asc');
    rowsOrdered.forEach(dt => {
      if (of.code === OFERTA.TIPO.getCode()) {
        if (codes.filter(c => c === dt.code).length) tipos.push(dt);
      } else if (of.code === OFERTA.CONSISTENCIA.getCode()) {
        if (codes.filter(c => c === dt.code).length) consistencias.push(dt);
      } else if (codes.filter(c => c === dt.code).length) extraordinarias.push(dt);
    });
  });

  return {
    tipos,
    consistencias,
    extraordinarias,
  };
};

export const refactorizeDietaTxtToConfig = (
  ofertas: OfertaI[],
  paciente: FetchPacientesBySubgrupoI
) => {
  const tipoTxt = paciente.DIEGRUTIP
    ? `_${paciente.DIEGRUTIP.toUpperCase().trim().replaceAll(' ', '_')}_`
    : null;
  const consTxt = paciente.DIEGRUCON
    ? `_${paciente.DIEGRUCON.toUpperCase().trim().replaceAll(' ', '_')}_`
    : null;

  const tipos: DetalleOfertaI[] = [];
  const consistencias: DetalleOfertaI[] = [];
  const extraordinarias: DetalleOfertaI[] = [];

  ofertas.forEach(of => {
    of.rows.forEach(dt => {
      if (tipoTxt && consTxt) {
        const dtNom = `_${dt.name.trim().toUpperCase().replaceAll(' ', '_')}_`;
        if (of.code === OFERTA.TIPO.getCode()) {
          if (tipoTxt.includes(dtNom)) tipos.push(dt);
        } else if (of.code === OFERTA.CONSISTENCIA.getCode()) {
          if (consTxt === dtNom) consistencias.push(dt);
        } else if (consTxt === dtNom) extraordinarias.push(dt);
      }
    });
  });

  return {
    tipos,
    consistencias,
    extraordinarias,
  };
};

export const pacientesAcostadosFactory = (
  ofertas: OfertaI[],
  paciente: FetchPacientesBySubgrupoI
) => {
  const data = refactorizeDietaTxtToConfig(ofertas, paciente);

  const result: PacienteAcostadoI = {
    cama: {
      id: paciente.CAMAID,
      codigo: paciente.HCACODIGO,
    },
    paciente: {
      id: paciente.GENPACIEN,
      nombreCompleto: paciente.GPANOMPAC,
      fechaNacimiento: paciente.GPAFECNAC,
    },
    folio: {
      fecha: paciente.HCSFECFOL,
      medico: {
        especialidad: {
          nombre: paciente.GEEDESCRI ? paciente.GEEDESCRI.trim().toUpperCase() : null,
        },
        nombreCompleto: paciente.GMENOMCOM ? paciente.GMENOMCOM.trim().toUpperCase() : null,
      },
    },
    dieta: {
      id: null,
      tipos: data.tipos,
      consistencias: data.consistencias,
      extraordinarias: data.extraordinarias,
      observacion: paciente.DIEGRUOBS,
      ultimaObservacion: null,
      enAislamiento: false,
    },
    camaId: paciente.CAMAID,
  };

  return result;
};

export const fetchPacientesAcostados = (
  context: GcmContextType,
  centroId: number,
  subgrupoCode: string
) => {
  switch (context) {
    case GCM_CONTEXTS.ALTACENTRO:
      return qrForAltaCentro(centroId, subgrupoCode);
    case GCM_CONTEXTS.VALLEDUPAR:
      return qrForValledupar(subgrupoCode);
    case GCM_CONTEXTS.AGUACHICA:
      return qrForAguachica(subgrupoCode);
    case GCM_CONTEXTS.SANJUAN:
      return qrForSanJuan(subgrupoCode);
  }
};

const qrForAltaCentro = (centroId: number, subgrupoCode: string) => `
SELECT CM.OID CAMAID,
C.HCACODIGO, 
C.HPNESTANC,
C.ADNINGRESO,
C.GPANOMPAC,
P.GPAFECNAC,
C.GENPACIEN,
G.HCSFECFOL, 
G.HCSDIETIP AS DIEGRUTIP, 
G.HCSDIENOM, 
G.HCSDIECON AS DIEGRUCON,
G.HCSDIEOBS AS DIEGRUOBS,
G.GEEDESCRI, 
G.GMENOMCOM
FROM GCVHOSDIEEVO G
RIGHT JOIN GCVHOSCENPAC C
RIGHT JOIN GENPACIEN P ON P.OID = C.GENPACIEN
INNER JOIN HPNDEFCAM CM ON CM.HCACODIGO = C.HCACODIGO
ON C.HPNESTANC = G.HPNESTANC 
WHERE C.HESFECSAL 
IS NULL AND C.HCAESTADO < 3 
AND C.ADNCENATE = ${centroId}
AND C.HSUCODIGO = '${subgrupoCode}';`;

const qrForValledupar = (subgrupoCode: string) => `Select * From (Select B.OID CAMAID, B.HCACODIGO,
  ET.OID HPNESTANC,
  C.OID ADNINGRESO,
  D.GPANOMCOM GPANOMPAC,
  D.GPAFECNAC,
  D.OID GENPACIEN,
  HCNFOLIO.HCFECFOL AS HCSFECFOL,
  UPPER(Case HCNFOLIO.HCNTIPHIS 
         When 28 Then (Select HCMHOSP00.HCCM08N23 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = HCNFOLIO.OID)
         When 11 Then (Select HCMEVO001.HCCM08N21 From HCMEVO001 Where HCMEVO001.HCNFOLIO = HCNFOLIO.OID)
         When 14 Then (Select HCMUCI001.HCCM08N124 From HCMUCI001 Where HCMUCI001.HCNFOLIO = HCNFOLIO.OID)
         When 16 Then (Select HCMUCIPOL.HCCM08N150 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
     When 39 Then (Select HCMURG002.HCCM08N16 From HCMURG002 Where HCMURG002.HCNFOLIO = HCNFOLIO.OID)
    End) As DIEGRUTIP,
  Replace(
    Case HCNFOLIO.HCNTIPHIS 
    When 28 Then IIF((Select HCMHOSP00.HCCM08N19 From HCMHOSP00  Where HCMHOSP00.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMHOSP00.HCCM08N19 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 28 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMHOSP00.HCCM08N19 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 28 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMHOSP00.HCCM08N19 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 28 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMHOSP00.HCCM08N19 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = HCNFOLIO.OID)) 
    When 11 Then IIF((Select HCMEVO001.HCCM08N20 From HCMEVO001  Where HCMEVO001.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMEVO001.HCCM08N20 From HCMEVO001 Where HCMEVO001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select HCMEVO001.HCCM08N20 From HCMEVO001 Where HCMEVO001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select HCMEVO001.HCCM08N20  From HCMEVO001 Where HCMEVO001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMEVO001.HCCM08N20 From HCMEVO001 Where HCMEVO001.HCNFOLIO = HCNFOLIO.OID))  
    When 14 Then IIF((Select HCMUCI001.HCCM08N119 From HCMUCI001  Where HCMUCI001.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select  HCMUCI001.HCCM08N119 From HCMUCI001   Where HCMUCI001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 14 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select  HCMUCI001.HCCM08N119 From HCMUCI001   Where HCMUCI001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 14 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select  HCMUCI001.HCCM08N119 From HCMUCI001 Where HCMUCI001.HCNFOLIO = (Select FOLIO.OID   From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 14 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMUCI001.HCCM08N119  From HCMUCI001 Where HCMUCI001.HCNFOLIO = HCNFOLIO.OID)) 
    When 16 Then IIF((Select HCMUCIPOL.HCCM08N146 From HCMUCIPOL  Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMUCIPOL.HCCM08N146 From HCMUCIPOL  Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 16 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                        (Select HCMUCIPOL.HCCM08N146 From HCMUCIPOL     Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 16 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    2 Rows Fetch First 1 Rows Only)), 
                        (Select HCMUCIPOL.HCCM08N146 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID  From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 16 And    FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only))), 
                        (Select HCMUCIPOL.HCCM08N146 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)) 
  When 28 Then IIF((Select HCMURG002.HCCM08N15 From HCMURG002  Where HCMURG002.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMURG002.HCCM08N15 From HCMURG002 Where HCMURG002.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 39 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMURG002.HCCM08N15 From HCMURG002 Where HCMURG002.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 39 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMURG002.HCCM08N15 From HCMURG002 Where HCMURG002.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 39 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMURG002.HCCM08N15 From HCMURG002 Where HCMURG002.HCNFOLIO = HCNFOLIO.OID)) 					   
    End, '', ',') As HCSDIENOM,
  UPPER(Case HCNFOLIO.HCNTIPHIS 
         When 28 Then (Select HCMHOSP00.HCCM10N21 From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = HCNFOLIO.OID)
         When 11 Then (Select HCMEVO001.HCCM10N18 From HCMEVO001 Where HCMEVO001.HCNFOLIO = HCNFOLIO.OID)
         When 14 Then (Select HCMUCI001.HCCM10N123 From HCMUCI001 Where HCMUCI001.HCNFOLIO = HCNFOLIO.OID)
         When 16 Then (Select HCMUCIPOL.HCCM10N148 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
     When 39 Then (Select HCMURG002.HCCM10N17 From HCMURG002 Where HCMURG002.HCNFOLIO = HCNFOLIO.OID)
    End) As DIEGRUCON,
   Case HCNFOLIO.HCNTIPHIS 
        When 28 Then (Select HCMHOSP00.HCCM03N22  From HCMHOSP00 Where HCMHOSP00.HCNFOLIO = HCNFOLIO.OID)
        When 11 Then (Select HCMEVO001.HCCM03N19 From HCMEVO001  Where HCMEVO001.HCNFOLIO = HCNFOLIO.OID)
        When 14 Then (Select HCMUCI001.HCCM03N122 From HCMUCI001  Where HCMUCI001.HCNFOLIO = HCNFOLIO.OID)
        When 16 Then (Select HCMUCIPOL.HCCM03N149 From HCMUCIPOL  Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
    When 39 Then (Select HCMURG002.HCCM03N18 From HCMURG002 Where HCMURG002.HCNFOLIO = HCNFOLIO.OID)
     End As DIEGRUOBS,
    (Select GENESPECI.GEEDESCRI From GENESPECI Where GENESPECI.OID = HCNFOLIO.GENESPECI) As GEEDESCRI,
    GENMEDICO.GMENOMCOM
  From HPNESTANC A
    Left Join HPNDEFCAM B On A.HPNDEFCAM = B.OID
    Left Join ADNINGRESO C On A.ADNINGRES = C.OID
  Left Join HPNESTANC ET on ET.ADNINGRES = C.OID AND ET.HESFECSAL IS NULL
    Left Join GENPACIEN D On C.GENPACIEN = D.OID
    Left Join GENESTRATO F On D.GENESTRATO = F.OID
    Left Join GENDIAGNO G On C.DGNDIAGNO = G.OID
    Left Join GENDETCON E On C.GENDETCON = E.OID
    Inner Join HPNSUBGRU H On B.HPNSUBGRU = H.OID
    Left Join GENARESER I On H.GENARESER = I.OID
    Left Join ADNCENATE On ADNCENATE.OID = C.ADNCENATE
    Left Join GENMUNICI On GENMUNICI.OID = D.DGNMUNICIPIO
    Left Join GENUSUARIO On GENUSUARIO.OID = C.GEENUSUARIO
    left Join HCNFOLIO On C.OID = HCNFOLIO.ADNINGRESO And HCNFOLIO.OID =
(Select Top 1 FOLIO.OID From HCNFOLIO As FOLIO
Where FOLIO.HCNTIPHIS In (28, 11, 14, 16, 39)
And FOLIO.ADNINGRESO =  HCNFOLIO.ADNINGRESO
  Order By FOLIO.OID Desc)
    Left Join GENMEDICO ON HCNFOLIO.GENMEDICO = GENMEDICO.OID 
  Where
    B.HCAESTADO < 3 And A.HESFECSAL Is Null and H.HSUCODIGO = '${subgrupoCode}'
  ) As DIETA
Order By DIETA.HCACODIGO asc`;

const qrForAguachica = (subgrupoCode: string) => `Select *
From (Select
	B.OID CAMAID,
    B.HCACODIGO,
	A.OID HPNESTANC,
	C.OID ADNINGRESO,
	D.GPANOMCOM GPANOMPAC,
	D.GPAFECNAC,
	D.OID GENPACIEN,
	HCNFOLIO.HCFECFOL,
    UPPER(Case HCNFOLIO.HCNTIPHIS 
         When 8 Then (Select HCMEVOHOS.HCCM10N08 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = HCNFOLIO.OID)
         When 2 Then (Select HCMEVOURG.HCCM10N37 From HCMEVOURG Where HCMEVOURG.HCNFOLIO = HCNFOLIO.OID)
         When 78 Then (Select HCMUCI24.HCCM10N146 From HCMUCI24 Where HCMUCI24.HCNFOLIO = HCNFOLIO.OID)
         When 9 Then (Select HCMINGUCI.HCCM10N83 From HCMINGUCI Where HCMINGUCI.HCNFOLIO = HCNFOLIO.OID)
		 When 1 Then (Select HCMURG001.HCCM10N78 From HCMURG001 Where HCMURG001.HCNFOLIO = HCNFOLIO.OID)
    End) As DIEGRUTIP,
	Replace(
    Case HCNFOLIO.HCNTIPHIS 
    When 28 Then IIF((Select HCMEVOHOS.HCCM08N11 From HCMEVOHOS  Where HCMEVOHOS.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMEVOHOS.HCCM08N11 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 8 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMEVOHOS.HCCM08N11 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 8 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMEVOHOS.HCCM08N11 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 8 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMEVOHOS.HCCM08N11 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = HCNFOLIO.OID)) 
    When 11 Then IIF((Select HCMEVOURG.HCCM08N36 From HCMEVOURG  Where HCMEVOURG.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMEVOURG.HCCM08N36 From HCMEVOURG Where HCMEVOURG.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 2 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select HCMEVOURG.HCCM08N36 From HCMEVOURG Where HCMEVOURG.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 2 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select HCMEVOURG.HCCM08N36  From HCMEVOURG Where HCMEVOURG.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 2 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMEVOURG.HCCM08N36 From HCMEVOURG Where HCMEVOURG.HCNFOLIO = HCNFOLIO.OID))  
    When 78 Then IIF((Select HCMUCI24.HCCM08N145 From HCMUCI24  Where HCMUCI24.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select  HCMUCI24.HCCM08N145 From HCMUCI24   Where HCMUCI24.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 78 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select  HCMUCI24.HCCM08N145 From HCMUCI24   Where HCMUCI24.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 78 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select  HCMUCI24.HCCM08N145 From HCMUCI24 Where HCMUCI24.HCNFOLIO = (Select FOLIO.OID   From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 78 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMUCI24.HCCM08N145  From HCMUCI24 Where HCMUCI24.HCNFOLIO = HCNFOLIO.OID)) 
    When 9 Then IIF((Select HCMINGUCI.HCCM08N82 From HCMINGUCI  Where HCMINGUCI.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMINGUCI.HCCM08N82 From HCMINGUCI  Where HCMINGUCI.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 9 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                        (Select HCMINGUCI.HCCM08N82 From HCMINGUCI   Where HCMINGUCI.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 9 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    2 Rows Fetch First 1 Rows Only)), 
                        (Select HCMINGUCI.HCCM08N82 From HCMINGUCI Where HCMINGUCI.HCNFOLIO = (Select FOLIO.OID  From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 9 And    FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only))), 
                        (Select HCMINGUCI.HCCM08N82 From HCMINGUCI Where HCMINGUCI.HCNFOLIO = HCNFOLIO.OID)) 
	When 1 Then IIF((Select HCMURG001.HCCM08N77 From HCMURG001  Where HCMURG001.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMURG001.HCCM08N77 From HCMURG001 Where HCMURG001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 1 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMURG001.HCCM08N77 From HCMURG001 Where HCMURG001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 1 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMURG001.HCCM08N77 From HCMURG001 Where HCMURG001.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 1 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMURG001.HCCM08N77 From HCMURG001 Where HCMURG001.HCNFOLIO = HCNFOLIO.OID)) 					   
    End, '', ',') As HCSDIENOM,
    UPPER(Case HCNFOLIO.HCNTIPHIS 
         When 8 Then (Select HCMEVOHOS.HCCM10N09 From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = HCNFOLIO.OID)
         When 2 Then (Select HCMEVOURG.HCCM10N38 From HCMEVOURG Where HCMEVOURG.HCNFOLIO = HCNFOLIO.OID)
         When 78 Then (Select HCMUCI24.HCCM10N147 From HCMUCI24 Where HCMUCI24.HCNFOLIO = HCNFOLIO.OID)
         When 9 Then (Select HCMINGUCI.HCCM10N84 From HCMINGUCI Where HCMINGUCI.HCNFOLIO = HCNFOLIO.OID)
		 When 1 Then (Select HCMURG001.HCCM10N79 From HCMURG001 Where HCMURG001.HCNFOLIO = HCNFOLIO.OID)
    End) AS DIEGRUCON,
    Case HCNFOLIO.HCNTIPHIS 
        When 8 Then (Select HCMEVOHOS.HCCM03N10  From HCMEVOHOS Where HCMEVOHOS.HCNFOLIO = HCNFOLIO.OID)
        When 2 Then (Select HCMEVOURG.HCCM03N39 From HCMEVOURG  Where HCMEVOURG.HCNFOLIO = HCNFOLIO.OID)
        When 78 Then (Select HCMUCI24.HCCM03N148 From HCMUCI24  Where HCMUCI24.HCNFOLIO = HCNFOLIO.OID)
        When 9 Then (Select HCMINGUCI.HCCM03N85 From HCMINGUCI  Where HCMINGUCI.HCNFOLIO = HCNFOLIO.OID)
		When 1 Then (Select HCMURG001.HCCM03N80 From HCMURG001 Where HCMURG001.HCNFOLIO = HCNFOLIO.OID)
     End AS DIEGRUOBS,
       (Select Concat(GENESPECI.GEECODIGO, ' - ', GENESPECI.GEEDESCRI)
        From GENESPECI Where GENESPECI.OID = HCNFOLIO.GENESPECI) AS GEEDESCRI,
      GENMEDICO.GMENOMCOM
  From HPNESTANC A
    Inner Join HPNDEFCAM B On A.HPNDEFCAM = B.OID
    Inner Join ADNINGRESO C On A.ADNINGRES = C.OID
    Inner Join GENPACIEN D On C.GENPACIEN = D.OID
    Left Join GENESTRATO F On D.GENESTRATO = F.OID
    Left Join GENDIAGNO G On C.DGNDIAGNO = G.OID
    Left Join GENDETCON E On C.GENDETCON = E.OID
    Inner Join HPNSUBGRU H On B.HPNSUBGRU = H.OID
    Left Join GENARESER I On H.GENARESER = I.OID
    Inner Join ADNCENATE On ADNCENATE.OID = C.ADNCENATE
    Left Join GENMUNICI On GENMUNICI.OID = D.DGNMUNICIPIO
    Left Join GENUSUARIO On GENUSUARIO.OID = C.GEENUSUARIO
    Inner Join HCNFOLIO On C.OID = HCNFOLIO.ADNINGRESO And HCNFOLIO.OID = (Select Top 1 FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.ADNINGRESO =  HCNFOLIO.ADNINGRESO
                                                                                 Order By FOLIO.OID Desc)
    Left Join GENMEDICO ON HCNFOLIO.GENMEDICO = GENMEDICO.OID 
  Where
    B.HCAESTADO < 3 And A.HESFECSAL Is Null AND H.HSUCODIGO = '${subgrupoCode}'
	) As DIETA
Order By DIETA.HCACODIGO`;

const qrForSanJuan = (subgrupoCode: string) => `Select *
From (Select
	B.OID CAMAID,
    B.HCACODIGO,
	A.OID HPNESTANC,
	C.OID ADNINGRESO,
	D.GPANOMCOM GPANOMPAC,
	D.GPAFECNAC,
	D.OID GENPACIEN,
	HCNFOLIO.HCFECFOL,
	Case HCNFOLIO.HCNTIPHIS 
         When 11 Then (Select HCMUCIPOL.HCCM10N163 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
         When 22 Then (Select HCMHCINUP.HCCM10N274 From HCMHCINUP Where HCMHCINUP.HCNFOLIO = HCNFOLIO.OID)
         When 65 Then (Select HCMINGHOS.HCCM10N39 From HCMINGHOS Where HCMINGHOS.HCNFOLIO = HCNFOLIO.OID)
         When 57 Then (Select HCMEVOURP.HCCM10N24 From HCMEVOURP Where HCMEVOURP.HCNFOLIO = HCNFOLIO.OID)
		 When 64 Then (Select HCMEVOUP.HCCM10N24 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = HCNFOLIO.OID)
		 When 106 Then (Select HCMUCI01.HCCM10N92 From HCMUCI01 Where HCMUCI01.HCNFOLIO = HCNFOLIO.OID)
    End As DIEGRUTIP,
    Replace(
    Case HCNFOLIO.HCNTIPHIS 
    When 11 Then IIF((Select HCMUCIPOL.HCCM08N167 From HCMUCIPOL  Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMUCIPOL.HCCM08N167 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMUCIPOL.HCCM08N167 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMUCIPOL.HCCM08N167 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 11 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMUCIPOL.HCCM08N167 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)) 
    When 22 Then IIF((Select HCMHCINUP.HCCM09N277 From HCMHCINUP  Where HCMHCINUP.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMHCINUP.HCCM09N277 From HCMHCINUP Where HCMHCINUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 22 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select HCMHCINUP.HCCM09N277 From HCMHCINUP Where HCMHCINUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 22 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select HCMHCINUP.HCCM09N277  From HCMHCINUP Where HCMHCINUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 22 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMHCINUP.HCCM09N277 From HCMHCINUP Where HCMHCINUP.HCNFOLIO = HCNFOLIO.OID))  
    When 65 Then IIF((Select HCMINGHOS.HCCM08N43 From HCMINGHOS  Where HCMINGHOS.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select  HCMINGHOS.HCCM08N43 From HCMINGHOS   Where HCMINGHOS.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 65 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only)) = 'NO APLICA', 
                           (Select  HCMINGHOS.HCCM08N43 From HCMINGHOS   Where HCMINGHOS.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 65 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  2 Rows Fetch First 1 Rows Only)), 
                           (Select  HCMINGHOS.HCCM08N43 From HCMINGHOS Where HCMINGHOS.HCNFOLIO = (Select FOLIO.OID   From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 65 And  FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset  1 Rows Fetch First 1 Rows Only))), 
                           (Select HCMINGHOS.HCCM08N43  From HCMINGHOS Where HCMINGHOS.HCNFOLIO = HCNFOLIO.OID)) 
    When 57 Then IIF((Select HCMEVOURP.HCCM08N27 From HCMEVOURP  Where HCMEVOURP.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select HCMEVOURP.HCCM08N27 From HCMEVOURP  Where HCMEVOURP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 57 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                        (Select HCMEVOURP.HCCM08N27 From HCMEVOURP   Where HCMEVOURP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 57 And   FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    2 Rows Fetch First 1 Rows Only)), 
                        (Select HCMEVOURP.HCCM08N27 From HCMEVOURP Where HCMEVOURP.HCNFOLIO = (Select FOLIO.OID  From HCNFOLIO As FOLIO   Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 57 And    FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset    1 Rows Fetch First 1 Rows Only))), 
                        (Select HCMEVOURP.HCCM08N27 From HCMEVOURP Where HCMEVOURP.HCNFOLIO = HCNFOLIO.OID)) 
	When 64 Then IIF((Select HCMEVOUP.HCCM08N26 From HCMEVOUP  Where HCMEVOUP.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMEVOUP.HCCM08N26 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 64 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMEVOUP.HCCM08N26 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 64 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMEVOUP.HCCM08N26 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 64 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMEVOUP.HCCM08N26 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = HCNFOLIO.OID))
	When 106 Then IIF((Select HCMUCI01.HCCM08N95 From HCMUCI01 Where HCMUCI01.HCNFOLIO = HCNFOLIO.OID) = 'NO APLICA', 
                       IIF((Select   HCMUCI01.HCCM08N95 From HCMUCI01 Where HCMUCI01.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 106 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only)) = 'NO APLICA',
                            (Select  HCMUCI01.HCCM08N95 From HCMUCI01 Where HCMUCI01.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 106 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 2 Rows Fetch First 1 Rows Only)), 
                             (Select HCMUCI01.HCCM08N95 From HCMUCI01 Where HCMUCI01.HCNFOLIO = (Select FOLIO.OID From HCNFOLIO As FOLIO Where FOLIO.OID != HCNFOLIO.OID And FOLIO.HCNTIPHIS = 106 And FOLIO.ADNINGRESO = HCNFOLIO.ADNINGRESO Order By FOLIO.OID Desc Offset 1 Rows Fetch First 1 Rows Only))),
                              (Select HCMUCI01.HCCM08N95 From HCMUCI01 Where HCMUCI01.HCNFOLIO = HCNFOLIO.OID))
    End, '', ',') As HCSDIENOM,
    Case HCNFOLIO.HCNTIPHIS 
         When 11 Then (Select HCMUCIPOL.HCCM10N164 From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
         When 22 Then (Select HCMHCINUP.HCCM10N275 From HCMHCINUP Where HCMHCINUP.HCNFOLIO = HCNFOLIO.OID)
         When 65 Then (Select HCMINGHOS.HCCM10N40 From HCMINGHOS Where HCMINGHOS.HCNFOLIO = HCNFOLIO.OID)
         When 57 Then (Select HCMEVOURP.HCCM10N25 From HCMEVOURP Where HCMEVOURP.HCNFOLIO = HCNFOLIO.OID)
		 When 64 Then (Select HCMEVOUP.HCCM10N23 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = HCNFOLIO.OID)
		 When 106 Then (Select HCMUCI01.HCCM10N93 From HCMUCI01 Where HCMUCI01.HCNFOLIO = HCNFOLIO.OID)
    End As DIEGRUCON,
    Case HCNFOLIO.HCNTIPHIS 
        When 11 Then (Select HCMUCIPOL.HCCM03N165  From HCMUCIPOL Where HCMUCIPOL.HCNFOLIO = HCNFOLIO.OID)
        When 22 Then (Select HCMHCINUP.HCCM03N276 From HCMHCINUP  Where HCMHCINUP.HCNFOLIO = HCNFOLIO.OID)
        When 65 Then (Select HCMINGHOS.HCCM03N41 From HCMINGHOS  Where HCMINGHOS.HCNFOLIO = HCNFOLIO.OID)
        When 57 Then (Select HCMEVOURP.HCCM03N26 From HCMEVOURP  Where HCMEVOURP.HCNFOLIO = HCNFOLIO.OID)
		When 64 Then (Select HCMEVOUP.HCCM03N25 From HCMEVOUP Where HCMEVOUP.HCNFOLIO = HCNFOLIO.OID)
		When 106 Then (Select HCMUCI01.HCCM03N94 From HCMUCI01 Where HCMUCI01.HCNFOLIO = HCNFOLIO.OID)
     End As DIEGRUOBS,
       (Select Concat(GENESPECI.GEECODIGO, ' - ', GENESPECI.GEEDESCRI)
        From GENESPECI Where GENESPECI.OID = HCNFOLIO.GENESPECI) GEEDESCRI,
      GENMEDICO.GMENOMCOM
  From HPNESTANC A
    Inner Join HPNDEFCAM B On A.HPNDEFCAM = B.OID
    Inner Join ADNINGRESO C On A.ADNINGRES = C.OID
    Inner Join GENPACIEN D On C.GENPACIEN = D.OID
    Left Join GENESTRATO F On D.GENESTRATO = F.OID
    Left Join GENDIAGNO G On C.DGNDIAGNO = G.OID
    Left Join GENDETCON E On C.GENDETCON = E.OID
    Inner Join HPNSUBGRU H On B.HPNSUBGRU = H.OID
    Left Join GENARESER I On H.GENARESER = I.OID
    Inner Join ADNCENATE On ADNCENATE.OID = C.ADNCENATE
    Left Join GENMUNICI On GENMUNICI.OID = D.DGNMUNICIPIO
    Left Join GENUSUARIO On GENUSUARIO.OID = C.GEENUSUARIO
    Inner Join HCNFOLIO On C.OID = HCNFOLIO.ADNINGRESO And HCNFOLIO.OID = (Select Top 1 FOLIO.OID From HCNFOLIO As FOLIO Where  FOLIO.ADNINGRESO =  HCNFOLIO.ADNINGRESO
                                                                                 Order By FOLIO.OID Desc)
    Left Join GENMEDICO ON HCNFOLIO.GENMEDICO = GENMEDICO.OID 
  Where
    B.HCAESTADO < 3 And A.HESFECSAL Is Null AND H.HSUCODIGO = '${subgrupoCode}'
	) As DIETA
Order By DIETA.HCACODIGO`;
