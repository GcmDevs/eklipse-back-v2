import { STORAGE_BASE } from "./base";

const INN = 'inn';
const BASE = 'public';

const SUBS = {
  EQP: 'eqp',
  VEH: 'veh'
};


export const FLLCT__INN__ = {
  /** ACTIVOS FIJOS */
  afn: {
    svt: {
      comprobantesFallo: `public/inn/afn/svt/cpbt-fallo`,
      comprobantesSoluc: `public/inn/afn/svt/cpbt-solu`,
    },
  },
  /** FARMACIA */
  fmc: {
    controlGastos: {
      facturas: `public/inn/fmc/cgt/facturas`,
      documentoAdjunto: `public/inn/fmc/cgt/docu-adjun`,
    },
    legalizacionFacturas: {
      facturas: `public/inn/fmc/ltf/facturas`,
      documentoAdjunto: `public/inn/fmc/ltf/docu-adjun`,
    },
  },
  /** CENTRAL DE COMPRAS */
  ctc: {
    comprobantesPago: 'public/inn/ctc/compr-pago',
    cotizaciones: 'public/inn/ctc/cotizaciones',
    itemsSolicitud: 'public/inn/ctc/items-solicitud',
    ordenes: 'public/temp/inn-ctc-ordenes',
    cxp: 'public/temp/inn-ctc-cxp',
  },
  eqp: {
    hdv: {
      regFotg: `${STORAGE_BASE}/${SUBS.EQP}/hdv/regFotg`,
    },
    catalogo: {
      docsTx: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/docs-tx`,
      docsAnex: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/docs-anex`,
      manuales: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/manuales`,
    },
    actas: {
      de_baja: `${STORAGE_BASE}/${SUBS.EQP}/actas/de-baja`
    },
    actividaes: `${STORAGE_BASE}/${SUBS.EQP}/actv`,
    biomedicos: `${STORAGE_BASE}/${SUBS.EQP}/biomedicos`,
    tic: `${STORAGE_BASE}/${SUBS.EQP}/tic`,
    refrigerantes: `${STORAGE_BASE}/${SUBS.EQP}/refrigerantes`
  },
  veh: {
    tanqueos: {
      evidencias: `${STORAGE_BASE}/${SUBS.VEH}/evidencias`
    }
  },
  /*OFERTAS*/
  ofer: {
    docs: `${BASE}/${INN}/ofer/docs`,
  }
};
