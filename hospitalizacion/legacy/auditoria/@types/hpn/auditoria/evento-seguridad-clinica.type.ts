import { CtmType } from '@common/domain/types';

/** EKHPNAUDITPEVSEGCLI */

export type EventoSeguridadClinicaCode =
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
  | 63;

export class EventoSeguridadClinicaType extends CtmType<EventoSeguridadClinicaCode> {}

const ABLA_RADIOFRE = new EventoSeguridadClinicaType(
  1,
  'ADMINISTRACIÓN EQUIVOCADA DE HEMOCOMPONENTES'
);
const ANGIO_CORONA = new EventoSeguridadClinicaType(2, 'BACTEREMIA POR DISPOSITIVOS');
const AORTOGRAMAS = new EventoSeguridadClinicaType(3, 'CAIDAS');
const ARTERIOGRAFI = new EventoSeguridadClinicaType(
  4,
  'CIRUGÍA EN LUGAR INCORRECTO, PROCEDIMIENTO INCORRECTO Y/O PACIENTE EQUIVOCADO'
);
const BIOPSIA_MEDUL = new EventoSeguridadClinicaType(5, 'CIRUGIAS CANCELADA');
const BIOPSIA_PANC = new EventoSeguridadClinicaType(
  6,
  'DAÑO O LESIÓN SECUNDARIO A MÚLTIPLES PUNCIONES'
);
const BIOPSIA_PULM = new EventoSeguridadClinicaType(7, 'DEHISCENCIA DE SUTURA');
const BIOPSIA_RENA = new EventoSeguridadClinicaType(8, 'DESGARRO PERINEAL GRADO 3 Y 4');
const CISTOTOMIA = new EventoSeguridadClinicaType(9, 'ENDOMETRITIS POS PARTO');
const COLANG_ENDOSC = new EventoSeguridadClinicaType(
  10,
  'ENTREGA ERRADA DE RESULTADOS DE LABORATORIOS O IMAGEN DIAGNÓSTICA'
);
const COLOCA_CAT_INTR = new EventoSeguridadClinicaType(
  11,
  'ERROR EN LA ADMINISTRACION DE MEDICAMENTOS'
);
const COLOCA_CAT_PTA = new EventoSeguridadClinicaType(
  12,
  'ERRORES EN LA ADMMINISTRACIÓN DE MEDICAMENTOS EN PACIENMTE INCORRECTO, VÍA INCORRECTA'
);
const COLPOSCOPIA = new EventoSeguridadClinicaType(
  13,
  'ERRORES EN LA LECTURA O RESULTADOS DE LABORATORIOS Y AYUDAS DX'
);
const DOPLER_MIEINFE = new EventoSeguridadClinicaType(
  14,
  'EXTUBACION O DECANULACION NO PROGRAMADA'
);
const ECOCARDIO_TE = new EventoSeguridadClinicaType(15, 'FALLAS EN DISPOSITIVOS MEDICOS');
const ECOCARDIO_TT = new EventoSeguridadClinicaType(16, 'FALLAS EN LA CONCILIACIÓN MEDICAMENTOSA');
const ECOGRAFIAS = new EventoSeguridadClinicaType(17, 'FALLAS EN LA DISPENSACIÓN DE HEMODERIVADOS');
const ELECTROENCEFALO = new EventoSeguridadClinicaType(
  18,
  'FALLAS EN LA DISPENSACIÓN DE MEDICAMENTOS'
);
const ENDOSCO_ALTAS = new EventoSeguridadClinicaType(
  19,
  'FALLAS EN LA FORMULACIÓN DE MEDICAMENTOS'
);
const ENDOSCO_BAJAS = new EventoSeguridadClinicaType(20, 'FALLAS EN LA RESPUESTA TERAPÉUTICA');
const EVDA = new EventoSeguridadClinicaType(21, 'FLEBITIS INFECCIOSA');
const EVDB = new EventoSeguridadClinicaType(22, 'FLEBITIS MECANICA');
const GASTROTOMIA = new EventoSeguridadClinicaType(23, 'FLEBITIS QUIMICA');
const HOLTER = new EventoSeguridadClinicaType(24, 'FUGA DEL PACIENTE');
const IMPLA_CAT_SUBCLA = new EventoSeguridadClinicaType(25, 'HEMORRAGIAS POR SOBREANTICUAGULACION');
const MESA_VASCULANTE = new EventoSeguridadClinicaType(
  26,
  'INFECCIÓN ASOCIADA A LA ATENCIÓN EN SALUD (IAAS)'
);
const NEFROSTOMIA = new EventoSeguridadClinicaType(
  27,
  'INFECCIÓN DE SITIO OPERATORIO ORGANO ESPACIO'
);
const PANANGIOGRA = new EventoSeguridadClinicaType(28, 'INFECCIÓN DE SITIO OPERATORIO PROFUNDA');
const PARACENTESIS = new EventoSeguridadClinicaType(
  29,
  'INFECCIÓN DE SITIO OPERATORIO SUPERFICIAL'
);
const PETSCAN = new EventoSeguridadClinicaType(30, 'INFECCIÓN NOSOCOMIAL');
const RADIO_OSEA = new EventoSeguridadClinicaType(31, 'INFECCIÓN URINARIA POR CATETER');
const RADIO_TORAX = new EventoSeguridadClinicaType(32, 'INFILTRACCIÓN ACCESO VENOSO PERIFERICO');
const RESONAN_MAGNET = new EventoSeguridadClinicaType(
  33,
  'INOPORTUNIDAD EN ENTREGA DE INSUMOS POR PARTE DE ALMACEN'
);
const TAC_ABDOMEN = new EventoSeguridadClinicaType(
  34,
  'INOPORTUNIDAD EN ENTREGA DE MATERIAL DE OSTEOSINTESIS (MAOS)'
);
const TAC_CARDIACO = new EventoSeguridadClinicaType(
  35,
  'INOPORTUNIDAD EN ENTREGA DE MEDICAMENTOS POR PARTE DE FARMACIA'
);
const TAC_TORAX = new EventoSeguridadClinicaType(
  36,
  'INOPORTUNIDAD EN LA ADMINISTRACIÓN DE MEDICAMENTOS'
);
const TELEMETRIAS = new EventoSeguridadClinicaType(37, 'IVU NOSOCOMIAL');
const TOMOGRAFIAS = new EventoSeguridadClinicaType(
  38,
  'LESIÓN FÍSICA CAUSADA POR DISPOSITIVOS MÉDICOS'
);
const TORACENTESIS = new EventoSeguridadClinicaType(
  39,
  'LESION POR PRESION CATEGORIA I (ZONA ENRROJECIDA)'
);
const TRAQUEOSTOMA = new EventoSeguridadClinicaType(
  40,
  'LESION POR PRESION CATEGORIA II (TEJIDO CELULAR SUBCUTANEO))'
);
const UROTAC = new EventoSeguridadClinicaType(41, 'LESION POR PRESION CATEGORIA III (MUSCULO)');
const VIDEOT1 = new EventoSeguridadClinicaType(42, 'LESION POR PRESION CATEGORIA IV (HUESO)');
const VIDEOT2 = new EventoSeguridadClinicaType(
  43,
  'LESIONES DERIVADAS DE PROCEDIMIENTOS QUIRURGICOS'
);
const VIDEOT3 = new EventoSeguridadClinicaType(
  44,
  'MORTALIDAD INESPERADA NO RELACIONADA CON EL CURSO NATURAL DE LA ENFERMEDAD'
);
const VIDEOT4 = new EventoSeguridadClinicaType(45, 'NEUMONÍA NOSOCOMIAL');
const VIDEOT5 = new EventoSeguridadClinicaType(46, 'NEUMONÍA POR VENTILACIÓN MECANICA');
const VIDEOT6 = new EventoSeguridadClinicaType(47, 'NEUMONIAS BRONCO ASPIRATIVA');
const VIDEOT7 = new EventoSeguridadClinicaType(
  48,
  'NEUMOTORAX Y/O HEMOTORAX ASOCIADA A INSERCION DE CATÉTER'
);
const VIDEOT8 = new EventoSeguridadClinicaType(
  49,
  'NEUMOTORAX Y/O HEMOTORAX ASOCIADA A VENTILACION MECANICA'
);
const VIDEOT9 = new EventoSeguridadClinicaType(50, 'PARTO EN CAMA');
const VIDEOT10 = new EventoSeguridadClinicaType(
  51,
  'PERITONITIS POR DEMORAS EN INTERVENCION QUIRÚRGICA CON DX DE APENDICITIS MAYOR A 12H'
);
const VIDEOT11 = new EventoSeguridadClinicaType(52, 'QUEMADURAS O DESFACELACIONES');
const VIDEOT12 = new EventoSeguridadClinicaType(53, 'REACCION ADVERSA A LA TRANSFUSIÓN (RAT)');
const VIDEOT13 = new EventoSeguridadClinicaType(54, 'REACCION ADVERSA A MEDICAMENTOS (RAM)');
const VIDEOT14 = new EventoSeguridadClinicaType(55, 'REINGRESO A LA UCI <48 H');
const VIDEOT15 = new EventoSeguridadClinicaType(
  56,
  'REINGRESO AL SERVICIO DE URGENCIA POR LA MISMA CAUSA ANTES DE 72H'
);
const VIDEOT16 = new EventoSeguridadClinicaType(
  57,
  'REINGRESO HOSPITALARIO POR LA MISMA CAUSA ANTES DE 15 DIAS'
);
const VIDEOT17 = new EventoSeguridadClinicaType(58, 'RETIRO VOLUNTARIO DE DISPOSITIVOS MÉDICOS');
const VIDEOT18 = new EventoSeguridadClinicaType(59, 'SECUESTRO DE UN BEBÉ');
const VIDEOT19 = new EventoSeguridadClinicaType(60, 'SUICIDIO INTRAHOSPITALARIO');
const VIDEOT20 = new EventoSeguridadClinicaType(61, 'TRASMISIÓN DE UNA ENFERMEDAD POR TRANSFUSIÓN');
const VIDEOT21 = new EventoSeguridadClinicaType(62, 'TRAUMA DEL NEONATO EN EL NACIMIENTO');
const VIDEOT22 = new EventoSeguridadClinicaType(63, 'CULTIVO POSITIVO');

export function eventoSeguridadClinicaTypeFactory(
  code: EventoSeguridadClinicaCode
): EventoSeguridadClinicaType {
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
      return VIDEOT1;
    case 43:
      return VIDEOT2;
    case 44:
      return VIDEOT3;
    case 45:
      return VIDEOT4;
    case 46:
      return VIDEOT5;
    case 47:
      return VIDEOT6;
    case 48:
      return VIDEOT7;
    case 49:
      return VIDEOT8;
    case 50:
      return VIDEOT9;
    case 51:
      return VIDEOT10;
    case 52:
      return VIDEOT11;
    case 53:
      return VIDEOT12;
    case 54:
      return VIDEOT13;
    case 55:
      return VIDEOT14;
    case 56:
      return VIDEOT15;
    case 57:
      return VIDEOT16;
    case 58:
      return VIDEOT17;
    case 59:
      return VIDEOT18;
    case 60:
      return VIDEOT19;
    case 61:
      return VIDEOT20;
    case 62:
      return VIDEOT21;
    case 63:
      return VIDEOT22;
  }
}

export const EVENTO_SEGURIDAD_CLINICA_VALUES = [
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
  DOPLER_MIEINFE,
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
  VIDEOT1,
  VIDEOT2,
  VIDEOT3,
  VIDEOT4,
  VIDEOT5,
  VIDEOT6,
  VIDEOT7,
  VIDEOT8,
  VIDEOT9,
  VIDEOT10,
  VIDEOT11,
  VIDEOT12,
  VIDEOT13,
  VIDEOT14,
  VIDEOT15,
  VIDEOT16,
  VIDEOT17,
  VIDEOT18,
  VIDEOT19,
  VIDEOT20,
  VIDEOT21,
  VIDEOT22,
];

export const EVENTO_SEGURIDAD_CLINICA = {
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
  DOPLER_MIEINFE,
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
  VIDEOT1,
  VIDEOT2,
  VIDEOT3,
  VIDEOT4,
  VIDEOT5,
  VIDEOT6,
  VIDEOT7,
  VIDEOT8,
  VIDEOT9,
  VIDEOT10,
  VIDEOT11,
  VIDEOT12,
  VIDEOT13,
  VIDEOT14,
  VIDEOT15,
  VIDEOT16,
  VIDEOT17,
  VIDEOT18,
  VIDEOT19,
  VIDEOT20,
  VIDEOT21,
  VIDEOT22,
};
