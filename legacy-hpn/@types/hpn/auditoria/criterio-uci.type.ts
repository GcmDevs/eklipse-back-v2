import { CtmType } from '@common/domain/types';

/** EKHPNAUDITPCRITUCI */

export type CriterioUCICode =
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
  | 23;

export class CriterioUCIType extends CtmType<CriterioUCICode> {}

const B1 = new CriterioUCIType(
  1,
  'ALTO RIESGO DE INESTABILIDAD HEMODINAMICA - MONITOREO HEMODINAMICO CONTINUO - ALTO RIESGO CARDIOVASCULAR Y RIESGO ELEVADO DE MUERTE'
);
const B2 = new CriterioUCIType(2, 'MONITOREO INTENSIVO DURANTE LAS PRIMERAS 24 HORAS, EXTUBACION');
const B3 = new CriterioUCIType(
  3,
  'MONITOREO INTENSIVO DURANTE LAS PRIMERAS 48 HORAS EXTUBACIONES FALLIDAS PREVIAS'
);
const B4 = new CriterioUCIType(
  4,
  'MONITOREO INTENSIVO DURANTE LAS PRIMERAS 48 HORAS POR INTUBACION PROLONGADA'
);
const B5 = new CriterioUCIType(
  5,
  'MONITOREO INTENSIVO DURANTE LAS PRIMERAS 48 HORAS, CIRUGIA > A 6 HORAS'
);
const A1 = new CriterioUCIType(6, 'MONITOREO INTENSIVO PARA MEDICIÓN DE GASTO CARDIACO INVASIVO');
const A2 = new CriterioUCIType(7, 'MONITOREO INTENSIVO PARA MEDICIÓN DE PRESION INVASIVA');
const A3 = new CriterioUCIType(8, 'MONITOREO INTENSIVO POR USO DE ADRENALINA (CUALQUIER DOSIS)');
const A4 = new CriterioUCIType(9, 'MONITOREO INTENSIVO POR USO DE CANULA DE ALTO FLUJO');
const A5 = new CriterioUCIType(
  10,
  'MONITOREO INTENSIVO POR USO DE DOBLE INOTRÓPICO (CUALQUIER DOSIS)'
);
const A6 = new CriterioUCIType(11, 'MONITOREO INTENSIVO POR USO DE DOBUTAMINA >5');
const A7 = new CriterioUCIType(12, 'MONITOREO INTENSIVO POR USO DE DOPAMINA >5');
const A8 = new CriterioUCIType(
  13,
  'MONITOREO INTENSIVO POR USO DE ISOPROTERENOL (CUALQUIER DOSIS)'
);
const A9 = new CriterioUCIType(14, 'MONITOREO INTENSIVO POR USO DE MARCAPASOS');
const A10 = new CriterioUCIType(15, 'MONITOREO INTENSIVO POR USO DE MILRINONA (CUALQUIER DOSIS)');
const A11 = new CriterioUCIType(16, 'MONITOREO INTENSIVO POR USO DE NORADRENALINA >0,2');
const A12 = new CriterioUCIType(17, 'MONITOREO INTENSIVO POR USO DE VENTILADOR');
const A13 = new CriterioUCIType(18, 'POSICIONAMIENTO EN PRONACION Y VENTILACION MECANICA');
const A14 = new CriterioUCIType(
  19,
  'REQUIERE MONITOREO INTENSIVO DURANTE LAS PRIMERAS 24 HORAS POP NEUROCIRUGIA'
);
const A15 = new CriterioUCIType(20, 'REQUIERE MONITOREO INTENSIVO POR SEPSIS');
const A16 = new CriterioUCIType(21, 'REQUIERE MONITOREO INTENSIVO POR TRAUMA MAYOR');
const A17 = new CriterioUCIType(
  22,
  'REQUIERE MONITOREO INTENSIVO POR USO DE SISTEMA INTRACEREBRAL'
);
const A18 = new CriterioUCIType(23, 'REQUIERE MONITOREO INTENSIVO POR USO FALLA MULTIORGANICA');

export function criterioUCITypeFactory(code: CriterioUCICode): CriterioUCIType {
  switch (code) {
    case 1:
      return B1;
    case 2:
      return B2;
    case 3:
      return B3;
    case 4:
      return B4;
    case 5:
      return B5;
    case 6:
      return A1;
    case 7:
      return A2;
    case 8:
      return A3;
    case 9:
      return A4;
    case 10:
      return A5;
    case 11:
      return A6;
    case 12:
      return A7;
    case 13:
      return A8;
    case 14:
      return A9;
    case 15:
      return A10;
    case 16:
      return A11;
    case 17:
      return A12;
    case 18:
      return A13;
    case 19:
      return A14;
    case 20:
      return A15;
    case 21:
      return A16;
    case 22:
      return A17;
    case 23:
      return A18;
  }
}

export const CRITERIO_UCI_VALUES = [
  B1,
  B2,
  B3,
  B4,
  B5,
  A1,
  A2,
  A3,
  A4,
  A5,
  A6,
  A7,
  A8,
  A9,
  A10,
  A11,
  A12,
  A13,
  A14,
  A15,
  A16,
  A17,
  A18,
];

export const CRITERIO_UCI = {
  B1,
  B2,
  B3,
  B4,
  B5,
  A1,
  A2,
  A3,
  A4,
  A5,
  A6,
  A7,
  A8,
  A9,
  A10,
  A11,
  A12,
  A13,
  A14,
  A15,
  A16,
  A17,
  A18,
};
