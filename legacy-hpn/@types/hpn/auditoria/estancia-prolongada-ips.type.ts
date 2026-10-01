import { CtmType } from '@common/domain/types';
import {
  AGRU_ESTANCIAS_PROLONGADAS_IPS,
  AgruEstanProloIpsCode,
  AgruEstanProloIpsType,
} from './estancia-prolongada-ips.agru.type';

/** EKHPNAUDITPESTPROIPS */

export type EstanciaProlongadaIpsCode =
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
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39
  | 40
  | 41
  | 42
  | 43
  | 44
  | 45
  | 46
  | 47
  | 48
  | 49
  | 50
  | 51
  | 52
  | 53
  | 54
  | 55
  | 56
  | 57
  | 58
  | 59
  | 60
  | 61
  | 62
  | 63
  | 64
  | 65
  | 66
  | 67
  | 68
  | 69
  | 70
  | 71
  | 72
  | 73
  | 74
  | 75
  | 76
  | 77
  | 78
  | 79
  | 80
  | 81
  | 82
  | 83
  | 84
  | 85
  | 86
  | 87
  | 88
  | 89
  | 90
  | 91
  | 92
  | 93
  | 94
  | 95
  | 96
  | 97
  | 98
  | 99
  | 100
  | 101
  | 102;

export class EstanciaProlongadaIpsType extends CtmType<EstanciaProlongadaIpsCode> {
  constructor(
    code: EstanciaProlongadaIpsCode,
    forHumans: string,
    private agrupador: AgruEstanProloIpsType
  ) {
    super(code, forHumans, null);
  }

  getAgrupador(): AgruEstanProloIpsType {
    return this.agrupador;
  }
}

const A = new EstanciaProlongadaIpsType(
  1,
  'COMPLICACION QX ISO ORGANO ESPACIO (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.ISO
);
const B = new EstanciaProlongadaIpsType(
  2,
  'COMPLICACION QX ISO PROFUNDA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.ISO
);
const C = new EstanciaProlongadaIpsType(
  3,
  'COMPLICACION QX ISO SUPERFICIAL (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.ISO
);
const D = new EstanciaProlongadaIpsType(
  4,
  'DEMORA EN RESULTADOS DE LABORATORIOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const E = new EstanciaProlongadaIpsType(
  5,
  'DEMORAS EN RESULTADOS DE IMAGENOLOGIA ESPECIALIZADA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const F = new EstanciaProlongadaIpsType(
  6,
  'DEMORAS EN TOMA DE IMAGENOLOGIA ESPECIALIZADA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const G = new EstanciaProlongadaIpsType(
  7,
  'ESTANCIA NO PROLONGADA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.ESTANCIA_NO_PROLONGADA
);
const H = new EstanciaProlongadaIpsType(
  8,
  'IAAS BACTEREMIA POR DISPOSITIVOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.IAAS
);
const I = new EstanciaProlongadaIpsType(
  9,
  'IAAS ITU POR CATETER (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.IAAS
);
const J = new EstanciaProlongadaIpsType(
  10,
  'IAAS NEUMONIA POR VENTILADOR (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.IAAS
);
const K = new EstanciaProlongadaIpsType(
  11,
  'INFECCION NOSOCOMIAL',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.IAAS
);
const M = new EstanciaProlongadaIpsType(
  12,
  'INOPORTUNIDAD DE JUNTA MEDICO QUIRURGICA(I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.JUNTA_MEDICO_QX
);
const N = new EstanciaProlongadaIpsType(
  13,
  'INOPORTUNIDAD REALIZACION DE CX CARDIOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const O = new EstanciaProlongadaIpsType(
  14,
  'INOPORTUNIDAD REALIZACION DE CX CARDIOLOGIA PEDIATRICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const P = new EstanciaProlongadaIpsType(
  15,
  'INOPORTUNIDAD REALIZACION DE CX CIRUGIA CARDIOVASCULAR',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const Q = new EstanciaProlongadaIpsType(
  16,
  'INOPORTUNIDAD REALIZACION DE CX CIRUGIA DE TORAX (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const R = new EstanciaProlongadaIpsType(
  17,
  'INOPORTUNIDAD REALIZACION DE CX CIRUGIA GENERAL (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const S = new EstanciaProlongadaIpsType(
  18,
  'INOPORTUNIDAD REALIZACION DE CX CIRUGIA ONCOLOGICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const T = new EstanciaProlongadaIpsType(
  19,
  'INOPORTUNIDAD REALIZACION DE CX CIRUGIA PLASTICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const U = new EstanciaProlongadaIpsType(
  20,
  'INOPORTUNIDAD REALIZACION DE CX CX CABEZA Y CUELLO (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const V = new EstanciaProlongadaIpsType(
  21,
  'INOPORTUNIDAD REALIZACION DE CX ELECTROFISIOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const W = new EstanciaProlongadaIpsType(
  22,
  'INOPORTUNIDAD REALIZACION DE CX GASTROENTEROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const X = new EstanciaProlongadaIpsType(
  23,
  'INOPORTUNIDAD REALIZACION DE CX GINECOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const Y = new EstanciaProlongadaIpsType(
  24,
  'INOPORTUNIDAD REALIZACION DE CX GINECOLOGIA ONCOLOGICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const Z = new EstanciaProlongadaIpsType(
  25,
  'INOPORTUNIDAD REALIZACION DE CX HEMATOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AA = new EstanciaProlongadaIpsType(
  26,
  'INOPORTUNIDAD REALIZACION DE CX HEMODINAMIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AB = new EstanciaProlongadaIpsType(
  27,
  'INOPORTUNIDAD REALIZACION DE CX MAXILOFACIAL (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AC = new EstanciaProlongadaIpsType(
  28,
  'INOPORTUNIDAD REALIZACION DE CX NEFROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AD = new EstanciaProlongadaIpsType(
  29,
  'INOPORTUNIDAD REALIZACION DE CX NEUMOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AE = new EstanciaProlongadaIpsType(
  30,
  'INOPORTUNIDAD REALIZACION DE CX NEUROCIRUGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AF = new EstanciaProlongadaIpsType(
  31,
  'INOPORTUNIDAD REALIZACION DE CX NEUROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AG = new EstanciaProlongadaIpsType(
  32,
  'INOPORTUNIDAD REALIZACION DE CX OBSTETRCXIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AH = new EstanciaProlongadaIpsType(
  33,
  'INOPORTUNIDAD REALIZACION DE CX OFTALMOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AI = new EstanciaProlongadaIpsType(
  34,
  'INOPORTUNIDAD REALIZACION DE CX ORTOPEDIA Y TRAUMATOLOGIA(I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AJ = new EstanciaProlongadaIpsType(
  35,
  'INOPORTUNIDAD REALIZACION DE CX PERINATOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AK = new EstanciaProlongadaIpsType(
  36,
  'INOPORTUNIDAD REALIZACION DE CX RX INTERVENCIONISTA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AM = new EstanciaProlongadaIpsType(
  37,
  'INOPORTUNIDAD REALIZACION DE CX UROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AN = new EstanciaProlongadaIpsType(
  38,
  'INOPORTUNIDAD REALIZACION DE ECOCARDIOGRAMA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const AO = new EstanciaProlongadaIpsType(
  39,
  'INOPORTUNIDAD REALIZACION DE EEG',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const AP = new EstanciaProlongadaIpsType(
  40,
  'INOPORTUNIDAD REALIZACION DE ENDOSCOPIAS',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const AQ = new EstanciaProlongadaIpsType(
  41,
  'INOPORTUNIDAD REALIZACION DE FIBROBRONCOSCOPIA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const AR = new EstanciaProlongadaIpsType(
  42,
  'INOPORTUNIDAD REALIZACION DE IC ANESTESIOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AS = new EstanciaProlongadaIpsType(
  43,
  'INOPORTUNIDAD REALIZACION DE IC CARDIOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AT = new EstanciaProlongadaIpsType(
  44,
  'INOPORTUNIDAD REALIZACION DE IC CARDIOLOGIA PEDIATRICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AU = new EstanciaProlongadaIpsType(
  45,
  'INOPORTUNIDAD REALIZACION DE IC CIRUGIA CARDIOVASCULAR',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AV = new EstanciaProlongadaIpsType(
  46,
  'INOPORTUNIDAD REALIZACION DE IC CIRUGIA DE TORAX (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AW = new EstanciaProlongadaIpsType(
  47,
  'INOPORTUNIDAD REALIZACION DE IC CIRUGIA GENERAL (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AX = new EstanciaProlongadaIpsType(
  48,
  'INOPORTUNIDAD REALIZACION DE IC CIRUGIA ONCOLOGICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AY = new EstanciaProlongadaIpsType(
  49,
  'INOPORTUNIDAD REALIZACION DE IC CIRUGIA PLASTICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const AZ = new EstanciaProlongadaIpsType(
  50,
  'INOPORTUNIDAD REALIZACION DE IC CX CABEZA Y CUELLO (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BA = new EstanciaProlongadaIpsType(
  51,
  'INOPORTUNIDAD REALIZACION DE IC ELECTROFISIOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BB = new EstanciaProlongadaIpsType(
  52,
  'INOPORTUNIDAD REALIZACION DE IC GASTROENTEROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BC = new EstanciaProlongadaIpsType(
  53,
  'INOPORTUNIDAD REALIZACION DE IC GINECOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BD = new EstanciaProlongadaIpsType(
  54,
  'INOPORTUNIDAD REALIZACION DE IC GINECOLOGIA ONCOLOGICA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BE = new EstanciaProlongadaIpsType(
  55,
  'INOPORTUNIDAD REALIZACION DE IC HEMATOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BF = new EstanciaProlongadaIpsType(
  56,
  'INOPORTUNIDAD REALIZACION DE IC HEMODINAMIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BG = new EstanciaProlongadaIpsType(
  57,
  'INOPORTUNIDAD REALIZACION DE IC MEDICINA DEL DOLOR (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BI = new EstanciaProlongadaIpsType(
  58,
  'INOPORTUNIDAD REALIZACION DE IC NEFROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BJ = new EstanciaProlongadaIpsType(
  59,
  'INOPORTUNIDAD REALIZACION DE IC NEUMOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BK = new EstanciaProlongadaIpsType(
  60,
  'INOPORTUNIDAD REALIZACION DE IC NEUROCIRUGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BM = new EstanciaProlongadaIpsType(
  61,
  'INOPORTUNIDAD REALIZACION DE IC NEUROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BN = new EstanciaProlongadaIpsType(
  62,
  'INOPORTUNIDAD REALIZACION DE IC OBSTETRICIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BO = new EstanciaProlongadaIpsType(
  63,
  'INOPORTUNIDAD REALIZACION DE IC OFTALMOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BP = new EstanciaProlongadaIpsType(
  64,
  'INOPORTUNIDAD REALIZACION DE IC ORTOPEDIA Y TRAUMATOLOGIA(I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BQ = new EstanciaProlongadaIpsType(
  65,
  'INOPORTUNIDAD REALIZACION DE IC OTORRINO (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BR = new EstanciaProlongadaIpsType(
  66,
  'INOPORTUNIDAD REALIZACION DE IC INFECTOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BS = new EstanciaProlongadaIpsType(
  67,
  'INOPORTUNIDAD REALIZACION DE IC PERINATOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BT = new EstanciaProlongadaIpsType(
  68,
  'INOPORTUNIDAD REALIZACION DE IC PSIQUIATRIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BU = new EstanciaProlongadaIpsType(
  69,
  'INOPORTUNIDAD REALIZACION DE IC REUMATOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BV = new EstanciaProlongadaIpsType(
  70,
  'INOPORTUNIDAD REALIZACION DE IC RX INTERVENCIONISTA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BW = new EstanciaProlongadaIpsType(
  71,
  'INOPORTUNIDAD REALIZACION DE IC TOXICOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BX = new EstanciaProlongadaIpsType(
  72,
  'INOPORTUNIDAD REALIZACION DE IC UROLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const BY = new EstanciaProlongadaIpsType(
  73,
  'INOPORTUNIDAD REALIZACION DE PANAGIOGRAFIA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const BZ = new EstanciaProlongadaIpsType(
  74,
  'INOPORTUNIDAD REALIZACION DE PET SCAN',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CA = new EstanciaProlongadaIpsType(
  75,
  'INOPORTUNIDAD RESULTADOS DE ECOCARDIOGRAMA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CB = new EstanciaProlongadaIpsType(
  76,
  'INOPORTUNIDAD RESULTADOS DE HOLTER',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CC = new EstanciaProlongadaIpsType(
  77,
  'INOPORTUNIDAD TOMA HOLTER',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CD = new EstanciaProlongadaIpsType(
  78,
  'NO DISPONIBILIDAD DE EQUIPOS BIOMEDICOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CE = new EstanciaProlongadaIpsType(
  79,
  'NO DISPONIBILIDAD DE HEMOCOMPONENTES (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CF = new EstanciaProlongadaIpsType(
  80,
  'NO DISPONIBILIDAD DE INSUMOS O DISPOSITIVOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CG = new EstanciaProlongadaIpsType(
  81,
  'NO DISPONIBILIDAD DE MAOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CH = new EstanciaProlongadaIpsType(
  82,
  'NO DISPONIBLIDAD DE MEDICAMENTOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CI = new EstanciaProlongadaIpsType(
  83,
  'INOPORTUNIDAD REALIZACION DE IC ANESTESIA CARDIOVASCULAR (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const CJ = new EstanciaProlongadaIpsType(
  84,
  'INOPORTUNIDAD REALIZACION DE IC MAXILO FACIAL  (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const CK = new EstanciaProlongadaIpsType(
  85,
  'DEMORAS EN REPORTE DE BIOPSIA  (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CM = new EstanciaProlongadaIpsType(
  86,
  'INOPORTUNIDAD REALIZACION DE IC REUMATOLOGIA  (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const CN = new EstanciaProlongadaIpsType(
  87,
  'CONDICION MEDICA (U)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CONDICION_MEDICA
);
const CO = new EstanciaProlongadaIpsType(
  88,
  'DEMORAS QT POR NO DISPONIBILIDAD DE MEDICAMENTOS',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.NO_DISPO_MED_MAT_INS
);
const CP = new EstanciaProlongadaIpsType(
  89,
  'NO VALORACION POP - MED POR ESPECIALISTA',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.VALORACION_SEGUIMIENTOS
);
const CQ = new EstanciaProlongadaIpsType(
  90,
  'DEMORAS EN REALIZACION DE ARTERIOGRAFIAS O CATT CARDIACO',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const CR = new EstanciaProlongadaIpsType(
  91,
  'INOPORTUNIDAD REALIZACION DE IC ONCOLOGIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const CS = new EstanciaProlongadaIpsType(
  92,
  'INOPORTUNIDAD REALIZACION DE IC MEDICINA INTERNA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INTERCONSULTAS
);
const CT = new EstanciaProlongadaIpsType(
  93,
  'FALLA EN LA GESTION ASISTENCIAL',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.ESTANCIA_NO_PROLONGADA
);
const CU = new EstanciaProlongadaIpsType(
  94,
  'INOPORTUNIDAD REALIZACION DE CX CARDIOLOGIA INTERVENCIONISTA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const CV = new EstanciaProlongadaIpsType(
  95,
  'INOPORTUNIDAD REALIZACION DE IC RADIOTERAPIA (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INOPORTUNIDAD_IC
);
const CW = new EstanciaProlongadaIpsType(
  96,
  'DISPONIBILIDAD DE SALAS DE CIRUGIAS',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const CX = new EstanciaProlongadaIpsType(
  97,
  'INOPORTUNIDAD REALIZACION DE IC FONOAUDIOLOGIA(I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INOPORTUNIDAD_IC
);
const CY = new EstanciaProlongadaIpsType(
  98,
  'FALLA EN GESTION ADMINISTRATIVA POR PROGRAMACION',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const CZ = new EstanciaProlongadaIpsType(
  99,
  'FALLA EN GESTION ADMINISTRATIVA POR AUTORIZACION',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const DA = new EstanciaProlongadaIpsType(
  100,
  'FALLA EN GESTION ADMINISTRATIVA POR MATERIALES',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.CIRUGIA
);
const DB = new EstanciaProlongadaIpsType(
  101,
  'DEMORA EN TOMA DE LABORATORIOS (I)',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.DEMORA_MEDIOS_DIAGNOSTICOS
);
const DC = new EstanciaProlongadaIpsType(
  102,
  'FALLA EN GESTION ADMINISTRATIVA POR AUTORIZACIONES',
  AGRU_ESTANCIAS_PROLONGADAS_IPS.INOPORTUNIDAD_IC
);

export function estanciaProlongadaIpsFactory(
  code: EstanciaProlongadaIpsCode
): EstanciaProlongadaIpsType {
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
    case 31:
      return AF;
    case 32:
      return AG;
    case 33:
      return AH;
    case 34:
      return AI;
    case 35:
      return AJ;
    case 36:
      return AK;
    case 37:
      return AM;
    case 38:
      return AN;
    case 39:
      return AO;
    case 40:
      return AP;
    case 41:
      return AQ;
    case 42:
      return AR;
    case 43:
      return AS;
    case 44:
      return AT;
    case 45:
      return AU;
    case 46:
      return AV;
    case 47:
      return AW;
    case 48:
      return AX;
    case 49:
      return AY;
    case 50:
      return AZ;
    case 51:
      return BA;
    case 52:
      return BB;
    case 53:
      return BC;
    case 54:
      return BD;
    case 55:
      return BE;
    case 56:
      return BF;
    case 57:
      return BG;
    case 58:
      return BI;
    case 59:
      return BJ;
    case 60:
      return BK;
    case 61:
      return BM;
    case 62:
      return BN;
    case 63:
      return BO;
    case 64:
      return BP;
    case 65:
      return BQ;
    case 66:
      return BR;
    case 67:
      return BS;
    case 68:
      return BT;
    case 69:
      return BU;
    case 70:
      return BV;
    case 71:
      return BW;
    case 72:
      return BX;
    case 73:
      return BY;
    case 74:
      return BZ;
    case 75:
      return CA;
    case 76:
      return CB;
    case 77:
      return CC;
    case 78:
      return CD;
    case 79:
      return CE;
    case 80:
      return CF;
    case 81:
      return CG;
    case 82:
      return CH;
    case 83:
      return CI;
    case 84:
      return CJ;
    case 85:
      return CK;
    case 86:
      return CM;
    case 87:
      return CN;
    case 88:
      return CO;
    case 89:
      return CP;
    case 90:
      return CQ;
    case 91:
      return CR;
    case 92:
      return CS;
    case 93:
      return CT;
    case 94:
      return CU;
    case 95:
      return CV;
    case 96:
      return CW;
    case 97:
      return CX;
    case 98:
      return CY;
    case 99:
      return CZ;
    case 100:
      return DA;
    case 101:
      return DB;
    case 102:
      return DC;
  }
}

export const ESTANCIA_PROLONGADA_IPS_VALUES = [
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
  AF,
  AG,
  AH,
  AI,
  AJ,
  AK,
  AM,
  AN,
  AO,
  AP,
  AQ,
  AR,
  AS,
  AT,
  AU,
  AV,
  AW,
  AX,
  AY,
  AZ,
  BA,
  BB,
  BC,
  BD,
  BE,
  BF,
  BG,
  BI,
  BJ,
  BK,
  BM,
  BN,
  BO,
  BP,
  BQ,
  BR,
  BS,
  BT,
  BU,
  BV,
  BW,
  BX,
  BY,
  BZ,
  CA,
  CB,
  CC,
  CD,
  CE,
  CF,
  CG,
  CH,
  CI,
  CJ,
  CK,
  CM,
  CN,
  CO,
  CP,
  CQ,
  CR,
  CS,
  CT,
  CU,
  CV,
  CW,
  CX,
  CY,
  CZ,
  DA,
  DB,
  DC,
];

export const ESTANCIA_PROLONGADA_IPS = {
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
  AF,
  AG,
  AH,
  AI,
  AJ,
  AK,
  AM,
  AN,
  AO,
  AP,
  AQ,
  AR,
  AS,
  AT,
  AU,
  AV,
  AW,
  AX,
  AY,
  AZ,
  BA,
  BB,
  BC,
  BD,
  BE,
  BF,
  BG,
  BI,
  BJ,
  BK,
  BM,
  BN,
  BO,
  BP,
  BQ,
  BR,
  BS,
  BT,
  BU,
  BV,
  BW,
  BX,
  BY,
  BZ,
  CA,
  CB,
  CC,
  CD,
  CE,
  CF,
  CG,
  CH,
  CI,
  CJ,
  CK,
  CM,
  CN,
  CO,
  CP,
  CQ,
  CR,
  CS,
  CT,
  CU,
  CV,
  CW,
  CX,
  CY,
  CZ,
  DA,
  DB,
  DC,
};
