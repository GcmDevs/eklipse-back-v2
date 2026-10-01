import { GCM_CONTEXTS, GcmContextType } from '@common/domain/types';
import { SolicitudTrasladoOrm } from '@orm/gcn';

export interface CentroWTI {
  ctx: GcmContextType;
  documento: string;
  id: number;
}

export interface GestionI {
  id: number;
  title: string;
  content: string;
  priority: number;
  state: number;
  authorId: number;
  fechaCancelacion: Date;
  canceObserva: string;
  motivoCancelacion: number;
  tipoGestion: number;
  authorFullName: string;
  createdAt: Date;
  canceladoPor: number;
  processorId: number;
  finisherId: number;
  centroProcesamiento: number;
  centroCierre: number;
  centroCancelacion: number;
  canceladoPorNombre: string;
  canceladoPorCedula: string;
  canceladoContexto: GcmContextType;
  processorFullName: string;
  processorContexto: GcmContextType;
  finisherFullName: string;
  finisherContexto: GcmContextType;
  processedAt: Date;
  finishedAt: Date;
  patientId: number;
  patientFullName: string;
  patientDocumentNumber: string;
  gender: string;
  age: Date;
  consecutive: string;
  centroId: number;
  area: number;
  bedName: string;
  codigoSubgrupo: string;
  nombreSubgrupo: string;
  contract: string;
  contexto: GcmContextType;
  codigo: string;
  traslados: SolicitudTrasladoOrm[];
}

const centrosWithTerceros: CentroWTI[] = [
  { ctx: GCM_CONTEXTS.ALTACENTRO, documento: '824001041', id: 1 },
  { ctx: GCM_CONTEXTS.ALTACENTRO, documento: '9006124131', id: 2 },
  { ctx: GCM_CONTEXTS.SANJUAN, documento: '900272582', id: 0 },
  { ctx: GCM_CONTEXTS.VALLEDUPAR, documento: '892300708', id: 0 },
  { ctx: GCM_CONTEXTS.AGUACHICA, documento: '900772387', id: 0 },
];

export const tercerosGCMbyCentro = (context: GcmContextType, id: number, classQuery: 1 | 2) => {
  const dt = centrosWithTerceros;
  if (classQuery === 1) {
    if (context === GCM_CONTEXTS.ALTACENTRO) {
      if (id !== 0) {
        return [
          ...dt.filter(el => el.ctx.getCode() !== context.getCode()),
          ...dt.filter(el => el.ctx.getCode() === context.getCode() && el.id !== id),
        ];
      } else return dt.filter(el => el.ctx.getCode() !== context.getCode());
    } else return dt.filter(el => el.ctx.getCode() !== context.getCode());
  } else {
    if (context === GCM_CONTEXTS.ALTACENTRO) {
      return dt.filter(el => el.ctx.getCode() === context.getCode() && el.id === id);
    } else return dt.filter(el => el.ctx.getCode() === context.getCode());
  }
};

export const fetchGestionesClinicas = (conditional: string) => {
  return `
SELECT
G.OID id,
G.TITULO title,
G.INFOADICIO content,
G.PRIORIDAD priority,
G.ESTADOGESTION state,
G.ASIGNADAPOR authorId,
G.FECHCANC fechaCancelacion,
G.CANCOBSERVA canceObserva,
G.MOTCANCELACION motivoCancelacion,
G.TIPOGESTI tipoGestion,
A.USUDESCRI authorFullName,
G.FECHREGISTRO createdAt,

G.CANCELADAPOR canceladoPor,
G.PROCESADAPOR processorId,
G.CERRADAPOR finisherId,

G.PROCESADAPORCENATE centroProcesamiento,
G.CERRADAPORCENATE centroCierre,
G.CANCELADAPORCENATE centroCancelacion,

UC.USUDESCRI canceladoPorNombre,
UC.USUNOMBRE canceladoPorCedula,
M.USUDESCRI processorFullName,
F.USUDESCRI finisherFullName,

G.FECHPROCESO processedAt,
G.FECHCIERRE finishedAt,
G.GENPACIEN patientId,
P.GPANOMCOM patientFullName,
P.PACNUMDOC patientDocumentNumber,
p.GPASEXPAC gender,
P.GPAFECNAC age,
G.AINCONSEC consecutive,
I.ADNCENATE centroId,
G.AREASIGNADA area,

CONCAT(CM.HCACODIGO , ' - ' , CM.HCANOMBRE) bedName,
SG.HSUCODIGO codigoSubgrupo,
SG.HSUNOMBRE nombreSubgrupo,
CONT.GDENOMBRE contract

FROM GCMHPNGESTI G
INNER JOIN GENUSUARIO A ON G.ASIGNADAPOR = A.OID
LEFT JOIN GENUSUARIO M ON G.PROCESADAPOR = M.OID
LEFT JOIN GENUSUARIO F ON G.CERRADAPOR= F.OID
LEFT JOIN GENUSUARIO UC ON G.CANCELADAPOR = UC.OID
INNER JOIN GENPACIEN P ON G.GENPACIEN = P.OID
INNER JOIN ADNINGRESO I ON I.AINCONSEC= G.AINCONSEC

LEFT JOIN HPNDEFCAM CM ON I.HPNDEFCAM = CM.OID
LEFT JOIN HPNSUBGRU SG ON CM.HPNSUBGRU = SG.OID
LEFT JOIN GENDETCON CONT ON I.GENDETCON = CONT.OID
WHERE ${conditional} CONVERT(DATE, G.FECHCIERRE, 103) >= @0 OR
${conditional} G.FECHCIERRE IS NULL`;
};

export const GCM_HCN_GTC_CONTEXTOS = [GCM_CONTEXTS.ALTACENTRO, GCM_CONTEXTS.VALLEDUPAR];
