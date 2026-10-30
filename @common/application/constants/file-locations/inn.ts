import { STORAGE_BASE } from './base';

const INN = 'inn';
const BASE = 'public';

const SUBS = {
  EQP: 'eqp',
  VEH: 'veh',
};

export const FLLCT__INN__ = {
  ges_actvo: {
    hdv: {
      regFotg: `${STORAGE_BASE}/${SUBS.EQP}/hdv/regFotg`,
    },
    catalogo: {
      docsTx: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/docs-tx`,
      docsAnex: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/docs-anex`,
      manuales: `${STORAGE_BASE}/${SUBS.EQP}/catalogo/manuales`,
    },
    actas: {
      de_baja: `${STORAGE_BASE}/${SUBS.EQP}/actas/de-baja`,
    },
    actividaes: `${STORAGE_BASE}/${SUBS.EQP}/actv`,
    biomedicos: `${STORAGE_BASE}/${SUBS.EQP}/biomedicos`,
    tic: `${STORAGE_BASE}/${SUBS.EQP}/tic`,
    refrigerantes: `${STORAGE_BASE}/${SUBS.EQP}/refrigerantes`,
  },
  veh: {
    tanqueos: {
      evidencias: `${STORAGE_BASE}/${SUBS.VEH}/evidencias`,
    },
  },
};

