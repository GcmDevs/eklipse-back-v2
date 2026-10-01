import { CtmType } from '@common/domain/types';
import {
  AGRU_ESTANCIAS_PROLONGADAS_ERP,
  AgruEstanProloErpType,
} from './estancia-prolongada-erp.agru.type';

export type EstanciaProlongadaErpUsuarioCode =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30;

export class EstanciaProlongadaErpUsuarioType extends CtmType<EstanciaProlongadaErpUsuarioCode> {
  constructor(
    code: EstanciaProlongadaErpUsuarioCode,
    forHumans: string,
    private agrupador: AgruEstanProloErpType
  ) {
    super(code, forHumans, null);
  }

  getAgrupador(): AgruEstanProloErpType {
    return this.agrupador;
  }
}

const A = new EstanciaProlongadaErpUsuarioType(
  1,
  'ABANDONO SOCIAL (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.NO_RED_APOYO
);
const B = new EstanciaProlongadaErpUsuarioType(
  2,
  'CONDICION MEDICA (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.CONDICION_MEDICA
);
const C = new EstanciaProlongadaErpUsuarioType(
  3,
  'DEMORA EN EL ALTA POR SISTEMA SOCIOECONOMICO (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.COPAGO
);
const D = new EstanciaProlongadaErpUsuarioType(
  4,
  'DEMORAS EN AUT COTIZACION SERVICIO NO CONTRATADO (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.AUT_COTIZACION
);
const E = new EstanciaProlongadaErpUsuarioType(
  5,
  'DEMORAS EN ENTREGA DE OXIGENO (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.INOP_EGRESO
);
const F = new EstanciaProlongadaErpUsuarioType(
  6,
  'DEMORAS EN GENERAR AUTORIZACION (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.GENERAR_AUT
);
const G = new EstanciaProlongadaErpUsuarioType(
  7,
  'DEMORAS EN LA AUT O ENTREGA DE MAOS (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.AUT_MAOS
);
const H = new EstanciaProlongadaErpUsuarioType(
  8,
  'DEMORAS EN REMITIR A RED HOSPITALARIA (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.REMISION
);
const I = new EstanciaProlongadaErpUsuarioType(
  9,
  'DEMORAS EN REUBICACIÓN EN UCC (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.UCC
);
const J = new EstanciaProlongadaErpUsuarioType(
  10,
  'DEMORAS EN VALORACION DE ESPECIALISTA TERCERIZADO (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.IC_TERCERIZADA
);
const K = new EstanciaProlongadaErpUsuarioType(
  11,
  'DEMORAS PARA EGRESO POR PADO (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.INOP_EGRESO
);
const M = new EstanciaProlongadaErpUsuarioType(
  12,
  'DESISTIMIENTO A PROCEDIMIENTO QX (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const N = new EstanciaProlongadaErpUsuarioType(
  13,
  'NEGACION A REALIZACIÓN DE MEDIO DX (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const O = new EstanciaProlongadaErpUsuarioType(
  14,
  'NEGACION DEL PACIENTE A HOMECARE (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const P = new EstanciaProlongadaErpUsuarioType(
  15,
  'NEGACION DEL PACIENTE A HOSPICASA (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const Q = new EstanciaProlongadaErpUsuarioType(
  16,
  'NEGACION DEL PACIENTE A PADO (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const R = new EstanciaProlongadaErpUsuarioType(
  17,
  'NEGACION DEL PACIENTE A UCC (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const S = new EstanciaProlongadaErpUsuarioType(
  18,
  'NEGACION DEL USUARIO A EGRESAR (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const T = new EstanciaProlongadaErpUsuarioType(
  19,
  'NEGACION DEL USUARIO A SER REMITIDO (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.DESISTIMIENTO_USUARIO
);
const U = new EstanciaProlongadaErpUsuarioType(
  20,
  'NO RED DE APOYO (U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.NO_RED_APOYO
);
const V = new EstanciaProlongadaErpUsuarioType(
  21,
  'ESTANCIA NO PROLONGADA',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.ESTANCIA_NO_PROLONGADA
);
const W = new EstanciaProlongadaErpUsuarioType(
  22,
  'DEMORAS EN RETOMA POR UNIDAD RENAL',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.RETOMA_UNIDAD_RENAL
);
const X = new EstanciaProlongadaErpUsuarioType(
  23,
  'DEMORAS EN AUTORIZACION TRASLADO AEREO',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.AUT_AMBULANCIA_AEREA
);
const Y = new EstanciaProlongadaErpUsuarioType(
  24,
  'DEMORAS AUT TRASLADO EN AMBULANCIA IPS-DOMICILIO',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.AUT_AMBULANCIA_TERRESTRE
);
const Z = new EstanciaProlongadaErpUsuarioType(
  25,
  'DEMORAS PALIATIVO AMBULATORIO',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.RETOMA_PALIATIVO_AMBULATOR
);
const AA = new EstanciaProlongadaErpUsuarioType(
  26,
  'DEMORAS EGRESO POR HOMECARE',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.HOMECARE
);
const AB = new EstanciaProlongadaErpUsuarioType(
  27,
  'DEMORAS RETOMA PLAN CANGURO EXTRAHOSPITALARIO',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.PLAN_CANGURO_EXTRAHOSP
);
const AC = new EstanciaProlongadaErpUsuarioType(
  28,
  'DEMORAS EN ENTRERGA DE OXIGENO (A)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.OXIGENO_DOMICILIARIO
);
const AD = new EstanciaProlongadaErpUsuarioType(
  29,
  'FALLAS EN LA GESTIÓN ASISTENCIAL',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.ESTANCIA_NO_PROLONGADA
);
const AE = new EstanciaProlongadaErpUsuarioType(
  30,
  'CONDICIONES  DE  LA  VIVIENDA(U)',
  AGRU_ESTANCIAS_PROLONGADAS_ERP.INOP_EGRESO
);

export function estanciaProlongadaERPUsuarioFactory(
  code: EstanciaProlongadaErpUsuarioCode
): EstanciaProlongadaErpUsuarioType {
  switch (code) {
    case 1:
      return A;
    case 2:
      return B;
    case 3:
      return C;
    case 4:
      return D;
    case 5:
      return E;
    case 6:
      return F;
    case 7:
      return G;
    case 8:
      return H;
    case 9:
      return I;
    case 10:
      return J;
    case 11:
      return K;
    case 12:
      return M;
    case 13:
      return N;
    case 14:
      return O;
    case 15:
      return P;
    case 16:
      return Q;
    case 17:
      return R;
    case 18:
      return S;
    case 19:
      return T;
    case 20:
      return U;
    case 21:
      return V;
    case 22:
      return W;
    case 23:
      return X;
    case 24:
      return Y;
    case 25:
      return Z;
    case 26:
      return AA;
    case 27:
      return AB;
    case 28:
      return AC;
    case 29:
      return AD;
    case 30:
      return AE;
  }
}

export const ESTANCIA_PROLONGADA_ERP_USUARIO_VALUES = [
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
  AA,
  AB,
  AC,
  AD,
  AE,
];

export const ESTANCIA_PROLONGADA_ERP_USUARIO = {
  A,
  B,
  C,
  D,
  E,
  F,
  G,
  H,
  I,
  J,
  K,
  M,
  N,
  O,
  P,
  Q,
  R,
  S,
  T,
  U,
  V,
  W,
  X,
  Y,
  Z,
  AA,
  AB,
  AC,
  AD,
  AE,
};
