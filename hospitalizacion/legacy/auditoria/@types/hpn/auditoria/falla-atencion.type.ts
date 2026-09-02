import { CtmType } from '@common/domain/types';

export type FallaAtencionCode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export class FallaAtencionType extends CtmType<FallaAtencionCode> {}

const FALL_ADM_PROFIX = new FallaAtencionType(
  1,
  'FALLAS EN LA ADMINISTRACIÓN DE PROFILAXIS PRE-QUIRURGICA'
);
const INF_SITI_OPERT = new FallaAtencionType(2, 'INFECCION DE SITIO OPERATORIO');
const DIL_HIS_CLI_INA = new FallaAtencionType(
  3,
  'DILIGENCIAMIENTO DE LA HISTORIA CLINICA INADECUADO'
);
const DIA_NOCO_CD_CLI = new FallaAtencionType(
  4,
  'EL DIAGNOSTICO NO ES COHERENTE CON EL CUADRO CLINICO DEL PACIENTE'
);
const MAN_EST_NO_CONC = new FallaAtencionType(
  5,
  'LOS MANEJOS ESTABLECIDOS NO SON CONSECUENTES CON EL  DIAGNOSTICOS'
);
const NO_INF_PAC_CES = new FallaAtencionType(
  6,
  'NO INFORMACION AL PACIENTE Y/O CUIDADOR ACERCA DEL ESTADO DE SALUD'
);
const TRA_NOBS_REC_G = new FallaAtencionType(
  7,
  'EL TRATAMIENTO NO ESTA BASADO EN LAS RECOMENDACIONES DE LA GUIA DE PRACTICA CLINICA'
);
const FALL_EQUI_BIOM = new FallaAtencionType(8, 'FALLA EN EQUIPOS BIOMEDICOS');
const ENTR_EQUIV_LAB = new FallaAtencionType(
  9,
  'ENTREGA EQUIVOCADA DE LABORATORIOS, PERDIDA O INSUFICIENCIA DE MUESTRAS O FALTA DE REPORTES DE PARACLINICOS'
);
const ENTR_EQUIV_IMA = new FallaAtencionType(
  10,
  'ENTREGA EQUIVOCADA DE IMAGEN DIAGNOSTICA ESPECIALIZADA'
);
const CANC_CIRU_PAC = new FallaAtencionType(
  11,
  'CANCELACION DE CIRUGIA EN PACIENTE HOSPITALIZADO O EN CIRUGIA PROGRAMADA'
);

export function fallaAtencionTypeFactory(code: FallaAtencionCode): FallaAtencionType {
  switch (code) {
    case 1:
      return FALL_ADM_PROFIX;
    case 2:
      return INF_SITI_OPERT;
    case 3:
      return DIL_HIS_CLI_INA;
    case 4:
      return DIA_NOCO_CD_CLI;
    case 5:
      return MAN_EST_NO_CONC;
    case 6:
      return NO_INF_PAC_CES;
    case 7:
      return TRA_NOBS_REC_G;
    case 8:
      return FALL_EQUI_BIOM;
    case 9:
      return ENTR_EQUIV_LAB;
    case 10:
      return ENTR_EQUIV_IMA;
    case 11:
      return CANC_CIRU_PAC;
    default:
      throw new Error('No existe tipo de ingreso con este codigo');
  }
}

export const FALLAS_ATENCION_VALUES = [
  FALL_ADM_PROFIX,
  INF_SITI_OPERT,
  DIL_HIS_CLI_INA,
  DIA_NOCO_CD_CLI,
  MAN_EST_NO_CONC,
  NO_INF_PAC_CES,
  TRA_NOBS_REC_G,
  FALL_EQUI_BIOM,
  ENTR_EQUIV_LAB,
  ENTR_EQUIV_IMA,
  CANC_CIRU_PAC,
];

export const FALLAS_ATENCION = {
  FALL_ADM_PROFIX,
  INF_SITI_OPERT,
  DIL_HIS_CLI_INA,
  DIA_NOCO_CD_CLI,
  MAN_EST_NO_CONC,
  NO_INF_PAC_CES,
  TRA_NOBS_REC_G,
  FALL_EQUI_BIOM,
  ENTR_EQUIV_LAB,
  ENTR_EQUIV_IMA,
  CANC_CIRU_PAC,
};
