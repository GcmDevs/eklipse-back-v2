import { GCM_CONTEXTS } from '@common/domain/types';
import { ROL_DEPENDIENTES } from '@inn/lgc/ctc/types/gen/dependencias';
import { ESTADOS } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';

export enum EstGlobSoliEnum {
  NO_ASIGNA = 1,
  REGISTRAD = 2,
  RECHAZADA = 3,
  APROB_COTIZAR = 4,
  CON_COTIZACIO = 5,
  COMPR_APROBAR = 6,
  ORDEN_PEND_AGREG = 7,
  ORDEN_AGREGADA = 8,
  ORDEN_PEND_APROB = 9,
  ORDEN_PEND_PROGR = 10,
  ORDEN_PEND_CONTA = 11,
  ORDEN_PEND_PAGAR = 12,
  ORDEN_PEND_RECIB = 13,
  ORDEN_PAGADA = 14,
  ORDEN_ENTREG = 15,
  ORDEN_FINALI = 16,
}

export const DIAS_PLAZO_CAJA_MENOR = 3;

export const CTXS_CLINICAS_VALIDAS = [
  GCM_CONTEXTS.AGUACHICA,
  GCM_CONTEXTS.ALTACENTRO,
  GCM_CONTEXTS.AMMEDICAL,
  GCM_CONTEXTS.SANJUAN,
  GCM_CONTEXTS.VALLEDUPAR,
];

export const SOLICITUDES_INVALIDAS_CODES = [
  ESTADOS.SOL_ELIMINADA.getCode(),
  ESTADOS.SOL_CANCELADA.getCode(),
  ESTADOS.SOL_GESTION_MANUAL.getCode(),
  ESTADOS.SOL_RECHAZO_TEMPORAL.getCode(),
  ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
  ESTADOS.SOL_REASIGNADA_OTRO_CENTRO.getCode(),
];

export const CARGADA_BY_COLABORADOR_CODES = [ESTADOS.SOL_CARG_COLABORADOR.getCode()];

export const ROL_DEPENDIENTES_CODES = [
  ROL_DEPENDIENTES.DIRECTOR.getCode(),
  ROL_DEPENDIENTES.COORDINADOR.getCode(),
];

export const SOLICITUDES_RECHAZADAS_ESTADOS_CODES = [
  ESTADOS.SOL_REASIGNADA_OTRO_CENTRO.getCode(),
  ESTADOS.SOL_CANCELADA.getCode(),
  ESTADOS.SOL_RECHAZO_TEMPORAL.getCode(),
  ESTADOS.SOL_RECHAZO_DEFINITIVO.getCode(),
  ESTADOS.SOL_GESTION_MANUAL.getCode(),
];

export const ROL_DEPENDIENTES_COMPRA_DIRECTA_CODES = [
  ROL_DEPENDIENTES.DIRECTOR.getCode(),
  ROL_DEPENDIENTES.SUBDIRECTOR.getCode(),
  ROL_DEPENDIENTES.COORDINADOR.getCode(),
];

export const ROL_DEPENDIENTES_CAN_APROBAR_SOLICITUDES_CODES = [
  ...ROL_DEPENDIENTES_COMPRA_DIRECTA_CODES,
];

export const VERIFICAR_VALORES = true;

export const CTC_FILE_LOCATIONS = {
  comprobantesPago: 'public/inn/ctc/compr-pago',
  cotizaciones: 'public/inn/ctc/cotizaciones',
  itemsSolicitud: 'public/inn/ctc/items-solicitud',
  ordenes: 'public/temp/inn-ctc-ordenes',
  cxp: 'public/temp/inn-ctc-cxp',
};

export const IVA = 19;
