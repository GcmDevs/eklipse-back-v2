import { CtmType } from '@common/domain/types';

export type EstudioDXCode =
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
  | 44;

export class EstudioDXType extends CtmType<EstudioDXCode> {}

const ABLA_RADIOFRE = new EstudioDXType(1, 'ABLACION + RADIOFRECUENCIA');
const ANGIO_CORONA = new EstudioDXType(2, 'ANGIOTAC CORONARIO');
const AORTOGRAMAS = new EstudioDXType(3, 'AORTOGRAMAS');
const ARTERIOGRAFI = new EstudioDXType(4, 'ARTERIOGRAFIAS');
const BIOPSIA_MEDUL = new EstudioDXType(5, 'BIOPSIA MEDULA');
const BIOPSIA_PANC = new EstudioDXType(6, 'BIOPSIA PANCREAS');
const BIOPSIA_PULM = new EstudioDXType(7, 'BIOPSIA PULMONAR');
const BIOPSIA_RENA = new EstudioDXType(8, 'BIOPSIA RENAL');
const CISTOTOMIA = new EstudioDXType(9, 'CISTOSTOMIA ');
const COLANG_ENDOSC = new EstudioDXType(10, 'COLANGIOPANCREATOGRAFIA ENDOSCOPICA');
const COLOCA_CAT_INTR = new EstudioDXType(11, 'COLOCACION CATETER INTRATECAL');
const COLOCA_CAT_PTA = new EstudioDXType(12, 'COLOCACION CATETER PORTA CAH');
const COLPOSCOPIA = new EstudioDXType(13, 'COLPOSCOPIA');
const DOPLER_CUELLO = new EstudioDXType(43, 'DOPLER DE CUELLO');
const DOPLER_MIEINFE = new EstudioDXType(14, 'DOPLER MIEMBROS INFERIORES');
const DOPLER_MIESUPE = new EstudioDXType(44, 'DOPLER MIEMBROS SUPERIORES');
const ECOCARDIO_TE = new EstudioDXType(15, 'ECOCARDIOGRAMA TE');
const ECOCARDIO_TT = new EstudioDXType(16, 'ECOCARDIOGRAMA TT');
const ECOGRAFIAS = new EstudioDXType(17, 'ECOGRAFIAS');
const ELECTROENCEFALO = new EstudioDXType(18, 'ELECTROENCEFALOGRAMA');
const ENDOSCO_ALTAS = new EstudioDXType(19, 'ENDOSCOPIAS ALTAS');
const ENDOSCO_BAJAS = new EstudioDXType(20, 'ENDOSCOPIAS BAJAS');
const EVDA = new EstudioDXType(21, 'EVDA');
const EVDB = new EstudioDXType(22, 'EVDB');
const GASTROTOMIA = new EstudioDXType(23, 'GASTROSTOMIA');
const HOLTER = new EstudioDXType(24, 'HOLTER');
const IMPLA_CAT_SUBCLA = new EstudioDXType(25, 'IMPLANTACION DE CATETER SUBCLAVIO');
const MESA_VASCULANTE = new EstudioDXType(26, 'MESA VASCULANTE');
const NEFROSTOMIA = new EstudioDXType(27, 'NEFROSTOMIA');
const PANANGIOGRA = new EstudioDXType(28, 'PANANGIOGRAFIA');
const PARACENTESIS = new EstudioDXType(29, 'PARACENTESIS');
const PETSCAN = new EstudioDXType(30, 'PETSCAN');
const RADIO_OSEA = new EstudioDXType(31, 'RADIOLOGIA OSEA');
const RADIO_TORAX = new EstudioDXType(32, 'RADIOLOGIA TORAX');
const RESONAN_MAGNET = new EstudioDXType(33, 'RESONANCIA MAGNETICA');
const TAC_ABDOMEN = new EstudioDXType(34, 'TAC ABDOMEN');
const TAC_CARDIACO = new EstudioDXType(35, 'TAC CARDIACO');
const TAC_TORAX = new EstudioDXType(36, 'TAC TORAX');
const TELEMETRIAS = new EstudioDXType(37, 'TELEMETRIAS');
const TOMOGRAFIAS = new EstudioDXType(38, 'TOMOGRAFIAS (TAC)');
const TORACENTESIS = new EstudioDXType(39, 'TORACENTESIS');
const TRAQUEOSTOMA = new EstudioDXType(40, 'TRAQUEOSTOMIA');
const UROTAC = new EstudioDXType(41, 'UROTAC');
const VIDEOTELEMETRIA = new EstudioDXType(42, 'VIDEOTELEMETRIA');

export function estudioDxTypeFactory(code: EstudioDXCode): EstudioDXType {
  switch (code) {
    case 1:
      return ABLA_RADIOFRE;
    case 2:
      return ANGIO_CORONA;
    case 3:
      return AORTOGRAMAS;
    case 4:
      return ARTERIOGRAFI;
    case 5:
      return BIOPSIA_MEDUL;
    case 6:
      return BIOPSIA_PANC;
    case 7:
      return BIOPSIA_PULM;
    case 8:
      return BIOPSIA_RENA;
    case 9:
      return CISTOTOMIA;
    case 10:
      return COLANG_ENDOSC;
    case 11:
      return COLOCA_CAT_INTR;
    case 12:
      return COLOCA_CAT_PTA;
    case 13:
      return COLPOSCOPIA;
    case 14:
      return DOPLER_MIEINFE;
    case 15:
      return ECOCARDIO_TE;
    case 16:
      return ECOCARDIO_TT;
    case 17:
      return ECOGRAFIAS;
    case 18:
      return ELECTROENCEFALO;
    case 19:
      return ENDOSCO_ALTAS;
    case 20:
      return ENDOSCO_BAJAS;
    case 21:
      return EVDA;
    case 22:
      return EVDB;
    case 23:
      return GASTROTOMIA;
    case 24:
      return HOLTER;
    case 25:
      return IMPLA_CAT_SUBCLA;
    case 26:
      return MESA_VASCULANTE;
    case 27:
      return NEFROSTOMIA;
    case 28:
      return PANANGIOGRA;
    case 29:
      return PARACENTESIS;
    case 30:
      return PETSCAN;
    case 31:
      return RADIO_OSEA;
    case 32:
      return RADIO_TORAX;
    case 33:
      return RESONAN_MAGNET;
    case 34:
      return TAC_ABDOMEN;
    case 35:
      return TAC_CARDIACO;
    case 36:
      return TAC_TORAX;
    case 37:
      return TELEMETRIAS;
    case 38:
      return TOMOGRAFIAS;
    case 39:
      return TORACENTESIS;
    case 40:
      return TRAQUEOSTOMA;
    case 41:
      return UROTAC;
    case 42:
      return VIDEOTELEMETRIA;
    case 43:
      return DOPLER_CUELLO;
    case 44:
      return DOPLER_MIESUPE;
  }
}

export const ESTUDIO_DX_VALUES = [
  ABLA_RADIOFRE,
  ANGIO_CORONA,
  AORTOGRAMAS,
  ARTERIOGRAFI,
  BIOPSIA_MEDUL,
  BIOPSIA_PANC,
  BIOPSIA_PULM,
  BIOPSIA_RENA,
  CISTOTOMIA,
  COLANG_ENDOSC,
  COLOCA_CAT_INTR,
  COLOCA_CAT_PTA,
  COLPOSCOPIA,
  DOPLER_CUELLO,
  DOPLER_MIEINFE,
  DOPLER_MIESUPE,
  ECOCARDIO_TE,
  ECOCARDIO_TT,
  ECOGRAFIAS,
  ELECTROENCEFALO,
  ENDOSCO_ALTAS,
  ENDOSCO_BAJAS,
  EVDA,
  EVDB,
  GASTROTOMIA,
  HOLTER,
  IMPLA_CAT_SUBCLA,
  MESA_VASCULANTE,
  NEFROSTOMIA,
  PANANGIOGRA,
  PARACENTESIS,
  PETSCAN,
  RADIO_OSEA,
  RADIO_TORAX,
  RESONAN_MAGNET,
  TAC_ABDOMEN,
  TAC_CARDIACO,
  TAC_TORAX,
  TELEMETRIAS,
  TOMOGRAFIAS,
  TORACENTESIS,
  TRAQUEOSTOMA,
  UROTAC,
  VIDEOTELEMETRIA,
];

export const ESTUDIO_DX = {
  ABLA_RADIOFRE,
  ANGIO_CORONA,
  AORTOGRAMAS,
  ARTERIOGRAFI,
  BIOPSIA_MEDUL,
  BIOPSIA_PANC,
  BIOPSIA_PULM,
  BIOPSIA_RENA,
  CISTOTOMIA,
  COLANG_ENDOSC,
  COLOCA_CAT_INTR,
  COLOCA_CAT_PTA,
  COLPOSCOPIA,
  DOPLER_CUELLO,
  DOPLER_MIEINFE,
  DOPLER_MIESUPE,
  ECOCARDIO_TE,
  ECOCARDIO_TT,
  ECOGRAFIAS,
  ELECTROENCEFALO,
  ENDOSCO_ALTAS,
  ENDOSCO_BAJAS,
  EVDA,
  EVDB,
  GASTROTOMIA,
  HOLTER,
  IMPLA_CAT_SUBCLA,
  MESA_VASCULANTE,
  NEFROSTOMIA,
  PANANGIOGRA,
  PARACENTESIS,
  PETSCAN,
  RADIO_OSEA,
  RADIO_TORAX,
  RESONAN_MAGNET,
  TAC_ABDOMEN,
  TAC_CARDIACO,
  TAC_TORAX,
  TELEMETRIAS,
  TOMOGRAFIAS,
  TORACENTESIS,
  TRAQUEOSTOMA,
  UROTAC,
  VIDEOTELEMETRIA,
};
